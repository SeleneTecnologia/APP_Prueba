import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface FiltersDTO {
  name: string;
  fromDate: string;
  toDate: string;
  loadStatusId: string;
  processStatusId: string;
}

@Injectable({
  providedIn: 'root',
})
export class FiltersService {

  private messageSource = new BehaviorSubject({name: '', fromDate: '', toDate: '', loadStatusId: '', processStatusId: ''});
  currentFilters = this.messageSource.asObservable();

  constructor() { }

  changeFilters(filters: FiltersDTO) {
    this.messageSource.next(filters);
  }
}
