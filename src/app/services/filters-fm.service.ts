import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface FiltersFMDTO {
  name: string;
  fromDate: string;
  toDate: string;
  loadStatusId: string;
  processStatusId: string;
}

@Injectable({
  providedIn: 'root',
})
export class FiltersFMService {
    
    private messageSource = new BehaviorSubject({name: '', fromDate: '', toDate: '', loadStatusId: '', processStatusId: ''});
    currentFiltersFM = this.messageSource.asObservable();
  
    constructor() { }
  
    changeFiltersFM(filters: FiltersFMDTO) {
      this.messageSource.next(filters);
    }
}
