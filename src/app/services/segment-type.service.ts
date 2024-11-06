import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface SegmentTypeDTO {
  id: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class SegmentTypeService {


  private apiUrl = `${environment.API_MS_BACKOFFICE}/v1/segment-types`;

  constructor(private http: HttpClient) { }

  getSegmentTypes(): Observable<SegmentTypeDTO[]> {
    return this.http.get<SegmentTypeDTO[]>(this.apiUrl);
  }
}