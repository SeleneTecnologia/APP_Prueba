// force-majeure.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams  } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ProcessStatus } from './process-status.service';
import { LoadStatus } from './load-status.service';

export interface DeletionResponseDTO {
    success: boolean;
    message: string;
}

export interface ForceMajeureListResponseDTO {
    forceMajeures: ForceMajeureDTO[];
    qty: number;
  }

  export interface ForceMajeureDTO {
    id: number;
    name: string;
    sequentialNumber: string;
    year: number;
    mimetype: string;
    loadStatus: LoadStatus;
    processStatus: ProcessStatus;
    entryTimestamp: string;
    filePath: string;
    username: string;
    uuid: string;
    type: string;
    correlative: string;
    is_delete:boolean;
    startExtractionTimestamp: string;
    endExtractionTimestamp: string;
    startValidationTimestamp: string;
  }


@Injectable({
  providedIn: 'root'
})
export class ForceMajeureService {
  private apiUrlListFilters         = `${environment.API_MS_BACKOFFICE}/force-majeure/list-force-majeure-events-filters`;
  private apiUrlDelete              = `${environment.API_MS_BACKOFFICE}/force-majeure/deleteForceMajeureEventById`;
  private apiUrlvalidateLastState   = `${environment.API_MS_BACKOFFICE}/force-majeure/validateLastState`;
  private apiUrlList                = `${environment.API_MS_BACKOFFICE}/force-majeure/list-force-majeure-events`; // Corregido para apuntar al endpoint correcto de listado


  constructor(private http: HttpClient) { }

  validateLastState(): Observable<any> {
    return this.http.get(this.apiUrlvalidateLastState)
      .pipe(catchError(this.handleError));
  }

  listForceMajeureEvents(): Observable<any> {
    return this.http.get(this.apiUrlList)
      .pipe(catchError(this.handleError));
  }

  listForceMajeureEventsWithFilters(
    name: string,
    fromDate?: string,
    toDate?: string,
    loadStatusId?: string,
    processStatusId?: string,
    page: number = 0,
    size: number = 10
  ): Observable<ForceMajeureListResponseDTO> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('name', name);

    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    if (loadStatusId) params = params.set('loadStatusId', loadStatusId);
    if (processStatusId) params = params.set('processStatusId', processStatusId);

    return this.http.get<ForceMajeureListResponseDTO>(this.apiUrlListFilters, { params });
  }

  // Manejo de errores HTTP
  private handleError(error: HttpErrorResponse): Observable<ForceMajeureListResponseDTO> {
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

  deleteForceMajeureEventById(id: number): Observable<DeletionResponseDTO> {
    return this.http.delete<DeletionResponseDTO>(`${this.apiUrlDelete}/${id}`);
  }

}
