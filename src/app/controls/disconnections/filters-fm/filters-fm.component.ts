import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoadStatus, LoadStatusService } from '@services/load-status.service';
import { ProcessStatus, ProcessStatusService } from '@services/process-status.service';
import { FiltersFMDTO, FiltersFMService } from '@services/filters-fm.service';
import { ForceMajeureService } from '@services/force-majeure.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-filters-fm',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filters-fm.component.html',
  styleUrl: './filters-fm.component.css'
})
export class FiltersFMComponent  implements OnInit, OnDestroy {
  name: string = '';
  fromDate: string = '';
  toDate: string = '';
  loadStatusId: string = '';
  processStatusId: string = '';

  loadStatuses: LoadStatus[] = [];
  processStatuses: ProcessStatus[] = []; 
  errorMessage: string = '';

  @Output() filtersChanged = new EventEmitter<{ name: string, fromDate: string, toDate: string, loadStatusId: string, processStatusId: string }>();

  constructor(private loadStatusService: LoadStatusService, private processStatusService: ProcessStatusService, private filtersService: FiltersFMService, private forceMajeureService: ForceMajeureService) { }

  filters: FiltersFMDTO = { name: '', fromDate: '', toDate: '', loadStatusId: '', processStatusId: '' };
  subscription?: Subscription;

  ngOnInit(): void {
    this.loadProcessStatuses();
    this.subscription = this.filtersService.currentFiltersFM.subscribe(filters => this.filters = filters );
  }

  loadProcessStatuses(): void {
    this.processStatusService.geProcessStatuses().subscribe({
      next: (data) => {
        this.processStatuses = data; 
      },
      error: (err) => {
        console.error('Error al cargar los estados de proceso:', err);
      }
    });
  }

  // Nueva función para validar las fechas
  areDatesValid(): boolean {
    if (this.fromDate && this.toDate) {
      const fromDateObj = new Date(this.fromDate);
      const toDateObj = new Date(this.toDate);

      // Validar que las fechas sean válidas
      if (isNaN(fromDateObj.getTime()) || isNaN(toDateObj.getTime())) {
        this.errorMessage = 'Una o ambas fechas no son válidas.';
        return false;
      }

      // Validar que "desde" no sea mayor que "hasta"
      if (fromDateObj > toDateObj) {
        this.errorMessage = 'La fecha "Desde" no puede ser mayor que la fecha "Hasta".';
        return false;
      }
    }

    this.errorMessage = ''; // Si no hay errores, limpiar el mensaje
    return true;
  }

  applyFiltersFM() {
    this.filtersService.changeFiltersFM({
        name: this.name,
        fromDate: this.fromDate,
        toDate: this.toDate,
        loadStatusId: this.loadStatusId,
        processStatusId: this.processStatusId});
  }



  // Método para limpiar los filtros
  clearFiltersFM() {
    this.name = '';
    this.fromDate = '';
    this.toDate = '';
    this.loadStatusId = '';
    this.processStatusId = '';
    this.errorMessage = ''; // Limpiar mensajes de error
    this.applyFiltersFM(); // Emitir los filtros vacíos después de limpiar
  }
  
  ngOnDestroy(): void {
    if(this.subscription) this.subscription.unsubscribe();
  }
}
