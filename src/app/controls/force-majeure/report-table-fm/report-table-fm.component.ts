// report-table-fm.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TableModule, TableLazyLoadEvent, TableFilterEvent, TablePageEvent } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { DownloadFileComponent } from '@controls/download-file/download-file.component';
import { FiltersFMDTO, FiltersFMService } from '@services/filters-fm.service';
import { Subscription } from 'rxjs';
import { LoadingService } from '@services/loading.service';
import { ForceMajeureDTO, ForceMajeureService } from '@services/force-majeure.service';
import { DeleteButtonComponent } from '@controls/delete-button/delete-button.component';
import { LoadStatus } from '@services/load-status.service';

@Component({
  selector: 'app-report-table-fm',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    DownloadFileComponent,
    DeleteButtonComponent
  ],
  templateUrl: './report-table-fm.component.html',
  styleUrls: ['./report-table-fm.component.css'],
  providers: [MessageService, DatePipe],
})
export class ReportTableFMComponent implements OnInit, OnDestroy {

  constructor(
    private forceMajeureService: ForceMajeureService,
    private messageService: MessageService,
    private datePipe: DatePipe,
    private loadingService: LoadingService,
    private filtersFMService: FiltersFMService
  ) {}

  filters: FiltersFMDTO = { name: '', fromDate: '', toDate: '', loadStatusId: '', processStatusId: '' };
  subscription?: Subscription;
  rows = 5;
  page = 0;
  first = 0;
  totalRecords = 0;
  errorMessage: string = '';
  data: any[] = [];

  forceMajeures: ForceMajeureDTO[] = []; 

  getProcessStatusBadgeClass(statusId: string): {
    description: string;
    badgeClass: string;
  } {
    const statusDescriptions: {
      [key: string]: { description: string; badgeClass: string };
    } = {
      CT00: { description: 'CALCULADO', badgeClass: 'bg-success' },
      CT01: {
        description: 'CALCULADO CON OBSERVACIONES',
        badgeClass: 'bg-warning text-dark',
      },
      CT02: { description: 'RECALCULADO', badgeClass: 'bg-success' },
      CT03: { description: 'PUBLICADO', badgeClass: 'bg-success' },
      CT04: { description: 'REPUBLICADO', badgeClass: 'bg-success' },
      MN00: { description: 'CREADO', badgeClass: 'bg-secondary' },
      NF00: { description: 'INICIADO', badgeClass: 'bg-secondary' },
      NF01: { description: 'RECHAZADO', badgeClass: 'bg-danger' },
      PE00: { description: 'ACEPTADO', badgeClass: 'bg-success' },
      PE01: {
        description: 'ACEPTADO CON OBSERVACIONES',
        badgeClass: 'bg-warning text-dark',
      },
      PE02: { description: 'BLOQUEADO', badgeClass: 'bg-danger' },
    };
    return (
      statusDescriptions[statusId] || {
        description: 'Desconocido',
        badgeClass: 'bg-danger',
      }
    );
  }

  getLoadStatusBadgeClass(loadStatus: LoadStatus): {
    description: string;
    badgeClass: string;
  } {
    if (loadStatus.isError) {
      return { description: 'ERROR', badgeClass: 'bg-danger' };
    } else {
      return { description: 'OK', badgeClass: 'bg-success' };
    }
  }

  
  truncateText(text: string): string {
    if (text.length > 10) {
      return text.slice(0, 18) + '...';
    }
    return text;
  }
  
  next() {
    this.first = this.first + this.rows;
  }

  prev() {
    this.first = this.first - this.rows;
  }

  reset() {
    this.first = 0;
  }

  pageChange(event: TablePageEvent) {
    this.first = event.first;
    this.rows = event.rows;
  }

  isLastPage(): boolean {
    return this.data ? this.first === this.data.length - this.rows : true;
  }

  isFirstPage(): boolean {
    return this.data ? this.first === 0 : true;
  }

  ngOnInit(): void {
    // Suscribirse a los filtros y cargar los datos iniciales
    this.subscription = this.filtersFMService.currentFiltersFM.subscribe(filters => {
      this.filters = filters;
      this.loadData(this.filters);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  loadData(filters: FiltersFMDTO): void {
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
        // Formatear la fecha si es necesario
        this.forceMajeures = data.forceMajeures.map((forceMajeure) => ({
          ...forceMajeure,
          // Puedes formatear las fechas si lo deseas
          // entryTimestamp: this.datePipe.transform(forceMajeure.entryTimestamp, 'dd-MM-yyyy HH:mm') + ''
        }));
        this.totalRecords = data.qty;
      },
      error: (err) => {
        this.errorMessage = `Error al cargar los datos: ${err.message}`;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: this.errorMessage });
      },
      complete: () => {
        this.loadingService.loadingOff();
      },
    });
  }

  loadLazyData(event: TableLazyLoadEvent) {
    this.totalRecords = 0;

    this.page = (event.first === 0 || event.first == undefined) ? 0 : event.first / (event.rows == undefined ? 1 : event.rows);
    this.rows = event.rows == undefined ? 10 : event.rows;

    this.loadData(this.filters);
  }

  filterData(event: TableFilterEvent) {
    console.log(event);
    if (event.filters) {
      if (event.filters["name"]?.value) {
        this.filters.name = event.filters["name"]?.value;
      } else {
        this.filters.name = ' ';
      }
      // Puedes agregar más filtros según sea necesario
    }

    this.loadData(this.filters);
  }

  editEvent(event: ForceMajeureDTO): void {
    // Lógica para editar el evento, puede navegar a otro componente o abrir un modal
    console.log('Editar evento', event);
  }

  // Método para manejar el evento de eliminación emitido por DeleteButtonComponent
  onDeleted(id: number): void {
    // Puedes opcionalmente usar el ID para alguna lógica adicional
    // Por ahora, simplemente refrescamos la tabla
    this.loadData(this.filters);
  }
}
