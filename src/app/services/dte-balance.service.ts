// dte-balance.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse ,HttpParams} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface DteBalanceDTO {
  id?: number | null; // Cambiado para aceptar number, null o undefined
  name: string;
  month?: string;
  year?: number;
  mimetype?: string;
  entryTimestamp?: string;
  filePath?: string;
  logPath?: string;
  username: string;
  uuid?: string;
}


export interface DteBalanceListResponseDTO {
  balances: DteBalanceDTO[];
  qty: number;
}



@Injectable({
  providedIn: 'root'
})
export class DteBalanceService {
  private apiUrl = `${environment.API_MS_BACKOFFICE}/v1/dte-balances`;
  constructor(private http: HttpClient) { }


  getBalances(
    name: string,
    fromDate?: string,
    toDate?: string,
    loadStatusId?: string,
    processStatusId?: string,
    page: number = 0,
    size: number = 10
  ): Observable<DteBalanceListResponseDTO> {
    // Definir los parámetros de consulta
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('name', name);

    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    if (loadStatusId) params = params.set('loadStatusId', loadStatusId);
    if (processStatusId) params = params.set('processStatusId', processStatusId);

    return this.http.get<DteBalanceListResponseDTO>(`${this.apiUrl}`, { params });
  }


  getExistsBalance(dteBalanceDto: Partial<DteBalanceDTO>): Observable<{ id: number | null }> {
    return this.http.post<{ id: number | null }>(`${this.apiUrl}/existsBalance`, dteBalanceDto)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error en la llamada HTTP:', error);
    let errorMsg: string;
    if (error.error instanceof ErrorEvent) {
      errorMsg = `Error del cliente: ${error.error.message}`;
    } else if (typeof error.error === 'string') {
      errorMsg = error.error;
    } else if (error.error && typeof error.error.message === 'string') {
      errorMsg = error.error.message;
    } else {
      errorMsg = `Error del servidor: ${error.status} - ${error.statusText}`;
    }
    return throwError(() => errorMsg);
  }
}
