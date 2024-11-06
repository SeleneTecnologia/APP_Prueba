import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface LoadStatus {
  id: string;
  description: string;
  isError: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LoadStatusService {

  private apiUrl = `${environment.API_MS_BACKOFFICE}/v1/load-statuses`;  // Ruta completa del endpoint

  constructor(private http: HttpClient) { }

  getLoadStatuses(): Observable<LoadStatus[]> {
    return this.http.get<LoadStatus[]>(this.apiUrl);
  }
}