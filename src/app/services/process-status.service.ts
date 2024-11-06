import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface ProcessStatus {
  id: string;
  description: string;
  isError: boolean;
  level: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProcessStatusService {


  private apiUrl = `${environment.API_MS_BACKOFFICE}/v1/process-statuses`;

  constructor(private http: HttpClient) { }
  
  geProcessStatuses(): Observable<ProcessStatus[]> {
    return this.http.get<ProcessStatus[]>(this.apiUrl);
  }
}