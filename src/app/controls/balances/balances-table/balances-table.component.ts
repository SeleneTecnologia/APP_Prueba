import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { TableFilterEvent, TableLazyLoadEvent, TableModule, TablePageEvent } from 'primeng/table';
import { LoadStatus } from '@services/load-status.service';
import { DteBalanceDTO, DteBalanceService } from '@services/dte-balance.service';
import { LoadingService } from '@services/loading.service';
import { FiltersDTO, FiltersService } from '@services/filters.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService } from 'primeng/api';
import { ConfirmPopupComponent } from '@shared/confirm-popup/confirm-popup.component';
import { DownloadFileComponent } from '@controls/download-file/download-file.component';

@Component({
  selector: 'app-balances-table',
  standalone: true,
  imports: [TableModule, CommonModule, ConfirmDialogModule, ConfirmPopupComponent,DownloadFileComponent],
  templateUrl: './balances-table.component.html',
  styleUrl: './balances-table.component.css',
  providers: [ MessageService ],
})
export class BalancesTableComponent implements OnInit, OnDestroy{

  constructor(
    private dteBalanceService: DteBalanceService,
    private datePipe: DatePipe,
    private loadingService: LoadingService,
    private filtersService: FiltersService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService
  ) {}

  filters: FiltersDTO = { name: '', fromDate: '', toDate: '', loadStatusId: '', processStatusId: '' };
  subscription?: Subscription;

  balances: DteBalanceDTO[] = [];


  ngOnInit(): void {
    //this.loadData();
    this.subscription = this.filtersService.currentFilters.subscribe(filters => {
      this.filters = filters
      this.loadData(this.filters);
    });
  }

  ngOnDestroy(): void {
    if(this.subscription) this.subscription.unsubscribe();
  }

  @Input() cols: { field: string; header: string }[] = []; // Cabeceras de la tabla
  //@Input() data: any[] = [];

  totalRecords = 0;
  errorMessage: string = '';
  data: any[] = [];

  @ViewChild('confirmPopup') confirmPopup!: ConfirmPopupComponent;

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

  onRowSelect() {

  }

  first = 0;

  rows = 5;
  page = 0;

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

  loadData(
    filters: FiltersDTO
  ): void {
    this.loadingService.loadingOn();
    this.dteBalanceService
      .getBalances(
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
          this.balances = data.balances.map(balance => ({
            ...balance,
            entryTimestamp: this.datePipe.transform(balance.entryTimestamp, 'dd-MM-yyyy HH:mm') + '' // Formatear la fecha
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




 loadLazyData(event: TableLazyLoadEvent) {
    this.totalRecords = 0;

    this.page = (event.first === 0 || event.first == undefined) ? 0 : event.first / (event.rows == undefined ? 1 : event.rows);
    this.rows = event.rows == undefined ? 10 : event.rows;

    this.loadData(this.filters);
  }

  filterData(event: TableFilterEvent){
    console.log(event);
    if( event.filters ){

      if(event.filters["name"]?.value){
        this.filters.name = event.filters["name"]?.value;
      } else{
        this.filters.name = ' ';
      }
      //console.log( event.filters["name"] );
    }

    this.loadData(this.filters);
  }

  navigateToDetail(balanceId: number): void {
    this.router.navigate([`balances`, balanceId], { relativeTo: this.route });
  }

  confirmDelete(id:number) {
    this.confirmPopup.confirm();
  }

  acceptDelete(){
    this.messageService.add({ severity: 'info', summary: 'Confirmado', detail: 'Registro eliminado' });
  }

  rejectDelete(){
    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'El registro no se elimin�' });
  }

}
