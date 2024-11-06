// validate-files.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ValidateFilesService {

  constructor() { }

  validateExcelFile(file: File): Observable<boolean> {
    // Verificar que el archivo tenga la extensión .xlsx
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      console.log('El archivo no tiene la extensión .xlsx');
      return of(false);
    }

    return new Observable(observer => {
      const reader = new FileReader();
      reader.onloadend = (e: any) => {
        const arrayBuffer = e.target.result;
        const byteArray = new Uint8Array(arrayBuffer).subarray(0, 4);
        let header = '';
        for (let i = 0; i < byteArray.length; i++) {
          header += byteArray[i].toString(16).padStart(2, '0').toUpperCase();
        }

        // La firma para archivos ZIP es '504B0304' (archivos .xlsx son archivos ZIP)
        const isValid = header === '504B0304';

        observer.next(isValid);
        observer.complete();
      };

      reader.onerror = () => {
        observer.error('Error al leer el archivo.');
      };

      // Leer los primeros 4 bytes del archivo
      reader.readAsArrayBuffer(file.slice(0, 4));
    });
  }

  validatePdfFile(file: File): Observable<boolean> {
    // Verificar que el archivo tenga la extensión .pdf
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      console.log('El archivo no tiene la extensión .pdf');
      return of(false);
    }

    return new Observable(observer => {
      const reader = new FileReader();
      reader.onloadend = (e: any) => {
        const arrayBuffer = e.target.result;
        const byteArray = new Uint8Array(arrayBuffer).subarray(0, 4);
        let header = '';
        for (let i = 0; i < byteArray.length; i++) {
          header += byteArray[i].toString(16).padStart(2, '0').toUpperCase();
        }

        // La firma para archivos PDF es '25504446' (hexadecimal para '%PDF')
        const isValid = header === '25504446';

        observer.next(isValid);
        observer.complete();
      };

      reader.onerror = () => {
        observer.error('Error al leer el archivo.');
      };

      // Leer los primeros 4 bytes del archivo
      reader.readAsArrayBuffer(file.slice(0, 4));
    });
  }
}
