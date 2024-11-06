import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PageTitleComponent } from '../../../controls/page-title/page-title.component';
import { UploadFileComponent } from '../../../controls/upload-file/upload-file.component';
import { FiltersComponent } from '../../../controls/disconnections/filters/filters.component';
import { EafService, EafDTO } from '../../../services/eaf.service';
import { ReportTableComponent } from '../../../controls/disconnections/report-table/report-table.component';
import { LoadingService } from '../../../services/loading.service';

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
  selector: 'app-coordinator-disconnections',
  standalone: true,
  imports: [PageTitleComponent, UploadFileComponent, FiltersComponent, ReportTableComponent],
  providers: [DatePipe],
  templateUrl: './coordinator-disconnections.component.html',
  styleUrl: './coordinator-disconnections.component.css'
})

export default class CoordinatorDisconnectionsComponent implements OnInit {

  eafs: EafDTO[] = [];
  errorMessage: string = '';

  headers = [
    { key: 'id', label: '#' },
    { key: 'name', label: 'Nombre' },
    { key: 'type', label: 'Tipo' },
    { key: 'entryTimestamp', label: 'Fecha' },
    { key: 'processStatusId', label: 'Estado Proceso' },
    { key: 'actions', label: 'Acciones' }
  ];

  cols = [
    { field: 'id', header: '#' },
    { field: 'name', header: 'Nombre' },
    { field: 'type', header: 'Tipo' },
    { field: 'entryTimestamp', header: 'Fecha' },
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
    private eafService: EafService,
    private datePipe: DatePipe,
    private loadingService: LoadingService) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(filters: { name: string, fromDate: string, toDate: string, loadStatusId: string, processStatusId: string } = { name: '', fromDate: '', toDate: '', loadStatusId: '', processStatusId: '' }): void {
    this.loadingService.loadingOn();
    this.eafService.getEafs(
      filters.name ? filters.name : ' ',
      filters.fromDate,
      filters.toDate,
      filters.loadStatusId,
      filters.processStatusId,
      0,
      10000
    ).subscribe({
      next: (data) => {
        this.eafs = data.eafs.map(eaf => ({
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


}
