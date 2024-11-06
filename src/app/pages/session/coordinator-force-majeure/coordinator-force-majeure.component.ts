// coordinator-balances.component.ts
import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageTitleComponent } from '../../../controls/page-title/page-title.component';
import { UploadFileComponent } from '../../../controls/upload-file/upload-file.component';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { s3DTO, S3Service } from '@services/s3.service';
import { ValidateFilesService } from '@services/validate-files.service';
import { LoadingService } from '@services/loading.service';
import { DeletionResponseDTO, ForceMajeureDTO, ForceMajeureService } from '@services/force-majeure.service';
import { ReportTableFMComponent } from '../../../controls/force-majeure/report-table-fm/report-table-fm.component';
import { FiltersFMComponent } from '../../../controls/disconnections/filters-fm/filters-fm.component';
import { DatePipe } from '@angular/common';
import { FiltersFMDTO, FiltersFMService } from '@services/filters-fm.service';
import { DeleteButtonComponent } from '@controls/delete-button/delete-button.component';
import { ConfirmPopupComponent } from '@shared/confirm-popup/confirm-popup.component';

@Component({
  selector: 'app-coordinator-force-majeure',
  standalone: true,
  imports: [
    CommonModule,
    PageTitleComponent,
    UploadFileComponent,
    DialogModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    ReportTableFMComponent, 
    FiltersFMComponent,
    DeleteButtonComponent,
    ConfirmPopupComponent,
  ],
  templateUrl: './coordinator-force-majeure.component.html',
  styleUrls: ['./coordinator-force-majeure.component.css'], // Cambiado 'styleUrl' a 'styleUrls'
  providers: [MessageService, ConfirmationService,DatePipe],
})
export default class CoordinatorForceMajeureComponent {
  @ViewChild(UploadFileComponent) uploadFileComponent!: UploadFileComponent;
  @ViewChild('confirmPopup') confirmPopup!: ConfirmPopupComponent;

  fileToUpload: File | null = null;
  s3Dt0: Partial<s3DTO> = {};
  data: any[] = [];
  page: number = 1;
  totalPages: number = 1;
  pageSize: number = 10000;
  totalRecords: number = 0;
  sortField: string = '';
  sortDirection: string = 'asc';
  idToDelete: number | null = null;

  constructor(
    private messageService: MessageService,
    private s3Service: S3Service,
    private validateFilesService: ValidateFilesService,
    private loadingService: LoadingService,
    private forceMajeureService: ForceMajeureService,
    private datePipe: DatePipe
  ) {}
  
  filters: FiltersFMDTO = { name: '', fromDate: '', toDate: '', loadStatusId: '', processStatusId: '' };

  ngOnInit(): void {
    this.loadData();
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
    this.validateFilesService.validatePdfFile(file).subscribe({
      next: (isValid) => {
        if (!isValid) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'El archivo seleccionado no es un archivo PDF válido.' });
          this.loadingService.loadingOff(); // Desactivar loading en caso de error
          return;
        }

        this.s3Dt0 = {
          name: file.name,
          mimetype: file.type,
          extension: file.name.substring(file.name.lastIndexOf('.')).toLowerCase(),
          username: 'hard',
          tipo: 'FUERZA_MAYOR'
        };

        this.s3Service.proceedWithUpload(file, this.s3Dt0).subscribe({
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
      },
      error: (error) => {
        console.error('Error al validar el archivo:', error);
        const errorMessage = typeof error === 'string' ? error : 'Ocurrió un error al validar el archivo';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMessage });
        this.loadingService.loadingOff(); // Desactivar loading en caso de error
      }
    });
  }

  // Método para validar el estado llamando al servicio
  validateState(): void {
    // Activar loading
    this.loadingService.loadingOn();
    this.forceMajeureService.validateLastState().subscribe({
      next: (response) => {
        console.log(response);
        if (response.success) {
          console.log('Ultimo estado valido ', response.message);
          this.loadingService.loadingOff(); // Desactivar loading al completar
          this.uploadFileComponent.showModal();
        }
      },
      error: (error) => {
        console.error('Error en la validación:', error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: error });
        this.loadingService.loadingOff(); // Desactivar loading al completar
      },
    });
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
    this.loadingService.loadingOff();
  }
  rows = 5;

  errorMessage: string = '';

  forceMajeures: ForceMajeureDTO[]=[]; 

  loadData(filters: { name: string, fromDate: string, toDate: string, loadStatusId: string, processStatusId: string } = { name: '', fromDate: '', toDate: '', loadStatusId: '', processStatusId: '' }): void {
    this.loadingService.loadingOn();
    this.forceMajeureService.listForceMajeureEventsWithFilters(
      filters.name ? filters.name : ' ',
      filters.fromDate,
      filters.toDate,
      filters.loadStatusId,
      filters.processStatusId,
      this.page,
      this.rows
    )
    .subscribe({
      next: (data) => {
        // Formatear la fecha
        this.forceMajeures = data.forceMajeures.map((forceMajeure) => ({
          ...forceMajeure,
          //entryTimestamp: this.datePipe.transform(forceMajeure.entryTimestamp, 'dd-MM-yyyy HH:mm') + '' // Formatear la fecha
        }));
        this.totalRecords = data.qty;
      },
      error: (err) => {
        this.errorMessage = `Error al cargar los datos: ${err.message}`;
      },
      complete: () => {
        this.loadingService.loadingOff();
      },
    });
  }

  onPageChange(newPage: number): void {
    alert("11")
    this.page = newPage;
    this.loadData();
  }

  onSortChange(event: { field: string, direction: string }): void {
    alert("22")

    this.sortField = event.field;
    this.sortDirection = event.direction;
  }

  onFiltersChanged(filters: { name: string, fromDate: string, toDate: string, loadStatusId: string, processStatusId: string } = { name: '', fromDate: '', toDate: '', loadStatusId: '', processStatusId: '' }) {
    alert("33")

    this.loadData(filters);
  }
}  
