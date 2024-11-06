import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface InstallationTypeDTO {
  id: number;
  description: string;
  status: boolean;
  endpoint: string;
}

export interface Installation {
  id: number;
  nombre: string;
}

export interface Commune {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class InstallationService {

  private apiUrl = `${environment.API_MS_BACKOFFICE}/v1/installation-types`;

  constructor(private http: HttpClient) { }

  getAllInstallationTypes(): Observable<InstallationTypeDTO[]> {
    return this.http.get<InstallationTypeDTO[]>(this.apiUrl);
  }

  getInfoTecnica(endpoint: string): Observable<any[]> {
    const url = `${environment.API_INFOTECNICA}${endpoint}`;
    return this.http.get<any[]>(url);
  }

  getCommunes(): Observable<Commune[]> {
    const url = `${environment.API_INFOTECNICA}/v1/comunas/`;
    return this.http.get<Commune[]>(url);
  }
}