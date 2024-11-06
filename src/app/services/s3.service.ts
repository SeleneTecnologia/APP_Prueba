// s3.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface s3DTO {
  id: number | null;
  name: string;
  mimetype: string;
  extension: string;
  username: string;
  tipo: string
}

@Injectable({
  providedIn: 'root'
})
export class S3Service {
  private apiUrl = `${environment.API_MS_BACKOFFICE}/s3`;

  constructor(private http: HttpClient) { }

  getPresignedUrl(s3DTO: Partial<s3DTO>): Observable<{ url: string; name: string; type: string }> {
    return this.http.post<{ url: string; name: string; type: string }>(`${this.apiUrl}/presigned-url`, s3DTO)
      .pipe(catchError(this.handleError));
  }

  // Método proceedWithUpload actualizado
  proceedWithUpload(file: File, s3DTO: Partial<s3DTO>): Observable<any> {
    console.log('proceedWithUpload');
    return this.getPresignedUrl(s3DTO).pipe(
      switchMap(response => {
        const presignedUrl = response.url;
        const s3DTOForDeletion: Partial<s3DTO> = {
          name: response.name, // Asignar el name desde response
          tipo: response.type  // Asignar el tipo desde response
        };
        return this.http.put(presignedUrl, file, {
          headers: { 'Content-Type': file.type }
        }).pipe(
          map(() => ({ success: true, message: 'Archivo subido exitosamente a S3' })),
          catchError(error => {
            console.error('Error al subir el archivo a S3:', error);
            // Llamar al método de eliminación en caso de error al subir
          return this.deleteForceMajeureEvent(s3DTOForDeletion).pipe(
            map(() => ({ error: true, message: 'Error al subir el archivo, se ha eliminado el registro.' })),
            catchError(deleteError => {
              console.error('Error al eliminar el registro:', deleteError);
              return of({ error: true, message: 'Error al subir el archivo y al eliminar el registro.' });
            })
          );
        })
      );
    }),
      catchError(error => {
        console.error('Error al obtener la URL prefirmada:', error);
        return of({ error: true, message: this.extractErrorMessage(error) });
      })
    );
  }

  deleteForceMajeureEvent(s3DTO: Partial<s3DTO>): Observable<any> {
    const url = `${this.apiUrl}/force-majeure-event`;
    return this.http.delete(url, { body: s3DTO }).pipe(
      map(() => ({ success: true, message: 'Registro eliminado exitosamente' })),
      catchError(error => {
        console.error('Error al eliminar el registro:', error);
        return of({ error: true, message: this.extractErrorMessage(error) });
      })
    );
  }

  private extractErrorMessage(error: any): string {
    if (typeof error === 'string') {
      return error;
    }
    if (error instanceof HttpErrorResponse) {
      return error.error || error.message || 'Error desconocido';
    }
    return 'Error desconocido';
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

  getPresignedUrlDownload(key: string): Observable<{ url: string; name: string; path: string }> {
    return this.http.get<{ url: string; name: string, path: string }>(`${this.apiUrl}/presigned-url-download/${key}`);      
  }

  proceedWithDownload(key: string): Observable<{ name: string, content: Blob }> {
    const encodedKey = btoa(key);  // Codificamos la key como string (base64)
    
    return this.getPresignedUrlDownload(encodedKey).pipe(
      switchMap(response => {
        return this.http.get(response.url, { responseType: 'blob' }).pipe(
          map(blob => {
            return {
              name: response.name,
              content: blob
            };
          })
        );
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error occurred during the download:', error);
        return throwError(() => new Error('Error al descargar el archivo desde S3.'));
      })
    );
  }  

}