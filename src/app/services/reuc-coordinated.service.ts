import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface ReucCoordinatedDTO {
  id: number;
  infotecnicaId: string;
  fantasyName: string;
  legalName: string;
  address: string;
  phone: string;
  rut: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReucCoordinatedService {

  private apiUrl = `${environment.API_MS_BACKOFFICE}/v1/reuc-coordinated`;

  constructor(private http: HttpClient) { }

  getAllReucCoordinated(): Observable<ReucCoordinatedDTO[]> {
    return this.http.get<ReucCoordinatedDTO[]>(this.apiUrl);
  }

  getReucCoordinatedByFilter(filter: string): Observable<ReucCoordinatedDTO[]> {
    return this.http.get<ReucCoordinatedDTO[]>(`${this.apiUrl}/filter?filter=${filter}`);
  }
}