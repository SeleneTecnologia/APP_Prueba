// coordinator-balances.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DteBalanceDTO, DteBalanceService } from '../../../services/dte-balance.service';
import { PageTitleComponent } from '../../../controls/page-title/page-title.component';
import { UploadFileComponent } from '../../../controls/upload-file/upload-file.component';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { s3DTO, S3Service } from '@services/s3.service';
import { ValidateFilesService } from '@services/validate-files.service';
import { LoadingService } from '../../../services/loading.service'; // Agregar esta importación
import { FiltersbalancesComponent } from '../../../controls/balances/filters/filters-balances.component';
import { BalancesTableComponent } from '../../../controls/balances/balances-table/balances-table.component';
import { DatePipe } from '@angular/common';


interface DataRow {
  id: number;
  name: string;
  type: string;
  date: string;
  deadline: string;
  status: string;
  actions: string;
}

@Component({
  selector: 'app-coordinator-balances',
  standalone: true,
  imports: [
    CommonModule,
    PageTitleComponent,
    UploadFileComponent,
    DialogModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    FiltersbalancesComponent,
    BalancesTableComponent
  ],
  templateUrl: './coordinator-balances.component.html',
  styleUrl: './coordinator-balances.component.css',
  providers: [MessageService, ConfirmationService,DatePipe]
})
export default class CoordinatorBalancesComponent implements OnInit {
  fileToUpload: File | null = null;
  s3Dt0: Partial<s3DTO> = {};
  balances: DteBalanceDTO[] = [];

  errorMessage: string = '';

  headers = [
    { key: 'id', label: '#' },
    { key: 'name', label: 'Nombre' },
    { key: 'entryTimestamp', label: 'Fecha' },
    { key: 'agno', label: 'Año' },
    { key: 'mes', label: 'Mes' },
    { key: 'processStatusId', label: 'Estado Proceso' },
    { key: 'actions', label: 'Acciones' }
  ];

  cols = [
    { field: 'id', header: '#' },
    { field: 'name', header: 'Nombre' },
    { field: 'entryTimestamp', header: 'Fecha' },
    { field: 'agno', header: 'Año' },
    { field: 'mes', header: 'Mes' },
    { field: 'processStatusId', header: 'Estado Proceso' },
    { field: 'actions', header: 'Acciones' }
  ];

  data: any[] = [];
  page: number = 1;
  totalPages: number = 1;
  pageSize: number = 10000;
  totalRecords: number = 0;
  sortField: string = '';
  sortDirection: string = 'asc';

  constructor(
    private dteBalanceService: DteBalanceService,
    private messageService: MessageService,
    private s3Service: S3Service,
  private datePipe: DatePipe,
    private validateFilesService: ValidateFilesService,
    private confirmationService: ConfirmationService,
    private loadingService: LoadingService  // Agregar el servicio
  ) {}
 ngOnInit(): void {
    this.loadData();
  }

loadData(filters: { name: string, fromDate: string, toDate: string, loadStatusId: string, processStatusId: string } = { name: '', fromDate: '', toDate: '', loadStatusId: '', processStatusId: '' }): void {
    this.loadingService.loadingOn();
    this.dteBalanceService.getBalances(
      filters.name ? filters.name : ' ',
      filters.fromDate,
      filters.toDate,
      filters.loadStatusId,
      filters.processStatusId,
      0,
      10000
    ).subscribe({
      next: (data) => {
        this.balances = data.balances.map(eaf => ({
          ...eaf,
          entryTimestamp: this.datePipe.transform(eaf.entryTimestamp, 'dd-MM-yyyy HH:mm') + ''
        }));
      },
      error: (err) => {
        this.errorMessage = `Error al cargar los datos: ${err.message}`;
      },
      complete: () => {
        this.loadingService.loadingOff();
      }
    });
  }


  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadData();
  }

  onSortChange(event: { field: string, direction: string }): void {
    this.sortField = event.field;
    this.sortDirection = event.direction;
  }

  onFiltersChanged(filters: { name: string, fromDate: string, toDate: string, loadStatusId: string, processStatusId: string } = { name: '', fromDate: '', toDate: '', loadStatusId: '', processStatusId: '' }) {
    this.loadData(filters);
  }


  resetErrorState(): void {
    this.fileToUpload = null;
    this.s3Dt0 = {};
  }

  uploadFileToS3(file: File): void {
    this.resetErrorState();
    this.fileToUpload = file;
    
    // Activar loading
    this.loadingService.loadingOn();

    // Paso 1: Validar el archivo Excel
    this.validateFilesService.validateExcelFile(file).subscribe({
      next: (isValid) => {
        if (!isValid) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'El archivo seleccionado no es un archivo XLSX válido.' });
          this.loadingService.loadingOff(); // Desactivar loading en caso de error
          return;
        }

        // Paso 2: Verificar si el balance existe
        const dteBalanceDto: Partial<DteBalanceDTO> = {
          name: file.name,
          username: 'hard' // TODO: Implementar lógica de manejo de sesión de usuario
        };

        this.dteBalanceService.getExistsBalance(dteBalanceDto).subscribe({
          next: (response) => {
            if (response.id !== 0 && response.id !== null) {
              // Balance existe, mostrar diálogo de confirmación
              this.s3Dt0 = this.createS3DTO(response.id,file, 'hard', 'DTE');
              this.confirmSave(file);
            } else {
              // Balance no existe, proceder con la subida
              this.s3Dt0 = this.createS3DTO(null,file, 'hard', 'DTE');
              this.uploadFile();
            }
          },
          error: (error) => {
            console.error('Error al verificar existencia del balance:', error);
            const errorMessage = typeof error === 'string' ? error : 'Ocurrió un error al verificar el balance';
            this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMessage });
            this.loadingService.loadingOff();
          }
        });
      },
      error: (error) => {
        console.error('Error al validar el archivo:', error);
        const errorMessage = typeof error === 'string' ? error : 'Ocurrió un error al validar el archivo';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMessage });
        this.loadingService.loadingOff(); // Desactivar loading en caso de error
      }
    });
  }

  confirmUpload(): void {
    if (this.fileToUpload) {
      this.loadingService.loadingOn(); // Activar loading al confirmar la subida
      this.uploadFile();
    } else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No hay archivo para subir.' });
    }
  }

  private uploadFile(): void {
    console.log('uploadFile');
    if (this.fileToUpload) {
      this.s3Dt0 = {
        ...this.s3Dt0, // Mantiene propiedades existentes como id
        name: this.fileToUpload.name,
        mimetype: this.fileToUpload.type,
        extension: this.fileToUpload.name.substring(this.fileToUpload.name.lastIndexOf('.')).toLowerCase(),
        username: 'hard',
      };
      this.s3Service.proceedWithUpload(this.fileToUpload, this.s3Dt0).subscribe({
        next: (uploadResponse) => {
          this.handleUploadResponse(uploadResponse);
        },
        error: (error) => {
          console.error('Error al subir el archivo:', error);
          const errorMessage = typeof error === 'string' ? error : 'Ocurrió un error al subir el archivo';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMessage });
          this.loadingService.loadingOff(); // Desactivar loading al completar
        },
        complete: () => {
          this.loadingService.loadingOff(); // Desactivar loading al completar
        }
      });
    } else {
      this.loadingService.loadingOff(); // Desactivar loading si no hay archivo para subir
      console.error('No hay archivo para subir.');
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No hay archivo para subir.' });
    }
  }

  private handleUploadResponse(uploadResponse: any): void {
    if (uploadResponse.success) {
      console.log('Archivo subido correctamente:', uploadResponse.message);
      this.messageService.add({ severity: 'success', summary: 'Éxito', detail: uploadResponse.message });
    } else {
      console.error('Error en la respuesta:', uploadResponse.message);
      const errorMessage = uploadResponse.message || 'Error inesperado al subir el archivo';
      this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMessage });
    }
  }

  cancelUpload(): void {
    this.resetErrorState();
    this.loadingService.loadingOff(); // Asegurar que el loading se desactiva cuando se cancela
  }

  createS3DTO(id: number | null, file: File, username: string, tipo: string) {
    const s3Dt0 = {
      id: id,
      name: file.name,
      mimetype: file.type,
      extension: file.name.substring(file.name.lastIndexOf('.')).toLowerCase(),
      username: username,
      tipo: tipo
    };
    return s3Dt0;
  }

  confirmSave(file :File) {
    console.log('confirmSave() ');
    this.loadingService.loadingOff();
    this.confirmationService.confirm({
      message: 'El balance ' + file.name + ' que está intentando subir ya existe. Si lo sube, actualizará la información existente. ¿Está seguro?',
      header: 'Confirmación',
      icon: 'pi pi-exclamation-triangle',
      acceptIcon: "none",
      rejectIcon: "none",
      acceptLabel: "Sí",
      rejectLabel: "No",
      rejectButtonStyleClass: "btn btn-primary me-2",
      acceptButtonStyleClass: "btn btn-secondary me-2",
      accept: () => {
        this.confirmUpload();
      },
      reject: () => {
        this.cancelUpload();
      }
    });
  }
}
