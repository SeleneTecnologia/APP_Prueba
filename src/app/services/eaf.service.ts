import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ProcessStatus } from './process-status.service';
import { LoadStatus } from './load-status.service';
import { environment } from '../../environments/environment';
import { SegmentTypeDTO } from './segment-type.service';

export interface EafDTO {
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
}

export interface EafListResponseDTO {
  eafs: EafDTO[];
  qty: number;
}

export interface ValidatedField<T> {
  value: T;
  validationDescription: string;
  errorDescription: string;
  errorLevel: string;
}

export interface EafHeaderDTO {
  id: number;
  eafId: number;
  startDate: ValidatedField<string>;
  startTime: ValidatedField<string>;
  segmentType: ValidatedField<SegmentTypeDTO>;
  failedElementNemotechnic: ValidatedField<string>;
  failedElementId: ValidatedField<number>;
  ownerReucId: ValidatedField<number>;
  ownerName: ValidatedField<string>;
  ownerRut: ValidatedField<string>;
  originCauseDescription: ValidatedField<string>;
  edacStatus: ValidatedField<boolean>;
  edacDescription: ValidatedField<string>;
  uuid: string;
}

export interface EafAttachmentDTO {
  id?: number;
  eafId: number;
  recordNumber: number;
  codeNeomante: ValidatedField<string>;
  substation: ValidatedField<any>;
  company: ValidatedField<any>;
  uuid?: string;
  additionalInfos: EafAttachmentAdditionalInfoDTO[];
}

export interface CommuneConsumptionDTO {
  id?: number;
  infotecnicaCommuneId: number;
  communeDescription?: string;
}

export interface EafConsumptionConsolidatedDTO {
  id?: number;
  eafHeaderId: number;
  recordNumber: number;
  substation: ValidatedField<any>;
  feeder: ValidatedField<string>;
  section: ValidatedField<any>;
  consumptionLoss: ValidatedField<number>;
  preFailureAverageConsumption: ValidatedField<number>;
  numberOfCustomers: ValidatedField<number>;
  company: ValidatedField<any>;
  unavailabilityTime: ValidatedField<number>;
  disconnectionTime: ValidatedField<number>;
  energyNotSupplied: ValidatedField<number>;
  disconnectionDatetime: ValidatedField<any>;
  availabilityDatetime: ValidatedField<any>;
  normalizationDatetime: ValidatedField<any>;
  communeConsumptions: ValidatedField<CommuneConsumptionDTO[]>;
  sectionList?: any[];
  additionalInfoRegulated: EafAttachmentAdditionalInfoAssociationLogsDTO[];
}

export interface ValidationTypeDTO {
  id?: number;
  description: string;
  level: string;
}

export interface EafSectionStatusDTO {
  id?: number;
  eafId: number;
  sectionName: string;
  validationType: ValidationTypeDTO;
  lastUpdateTimestamp?: string;
}

export interface EafDetailDTO {
  eafDTO?: EafDTO;
  header?: EafHeaderDTO;
  attachments: EafAttachmentDTO[];
  consumptions: EafConsumptionConsolidatedDTO[];
  sectionStatuses: EafSectionStatusDTO[];
}

export interface EafHeaderUpdateDTO {
  startDate: string;
  startTime: string;
  segmentTypeId: string;
  failedElementNemotechnic: string;
  failedElementId: number;
  ownerReucId: number;
  ownerName: string;
  ownerRut: string;
  originCauseDescription: string;
  edacStatus: boolean;
  edacDescription: string;
}

export interface EafAttachmentUpdateDTO {
  id?: number;
  eafId: number;
  recordNumber: number;
  codeNeomante: string;
  substationInfotecnicaId: number;
  substationName: string;
  companyInfotecnicaId: number;
  companyName: string;
  uuid?: string;
}

export interface EafConsumptionUpdateDTO {
  id?: number;
  eafHeaderId: number;
  recordNumber: number;
  substationInfotecnicaId: number;
  substationName: string;
  feeder: string;
  sectionInfotecnicaId: number;
  sectionName: string;
  consumptionLoss: number;
  preFailureAverageConsumption: number;
  numberOfCustomers: number;
  companyName: string;
  companyInfotecnicaId: number;
  disconnectionDatetime: Date;
  availabilityDatetime: Date;
  normalizationDatetime: Date;
  communeConsumptions: CommuneConsumptionDTO[];
}

export interface EafUpdateDTO {
  header: EafHeaderUpdateDTO;
  attachments: EafAttachmentUpdateDTO[];
  consumptions: EafConsumptionUpdateDTO[];
}

export interface EafAttachmentAdditionalInfoDTO {
  id: number;
  name: string;
  filePath: string;
  uuid?: string;
  regulatedProcessStatusId: string;
  freeDXProcessStatusId: string;
  allAssociated: number;
}

export interface EafAttachmentAdditionalInfoResponseDTO {
  additionalInfos: EafAttachmentAdditionalInfoDTO[];
}

export interface EafAttachmentAdditionalInfoRegulatedLogsDTO {
  id: number;
  coordinatedAdditionalInfoId: string;
  errorDescription: string;
  recordNumber: number;
}

export interface EafAttachmentAdditionalInfoRegulatedLogsResponseDTO {
  additionalInfoLogs: EafAttachmentAdditionalInfoRegulatedLogsDTO[];
}

export interface EafAttachmentAdditionalInfoAssociationLogsDTO {
	affectedCustNoDelay: number;
	affectedCustWithDelay: number;
	associated: number;
	busbarInfotecnicaId: number;
	communes: string;
	consumptionLoss: number;
	disconnectionTime: Date;
	equivCpphMw: number;
	equivNormalizationTime: Date;
	feeder:string;
	id: number;
	intEnergy25Mwh: number;
	intEnergy312Mwh: number;
	recordNumber: number;
	sectionInfotecnicaId: number;
	zonalTXSystem: string;
}

export interface EafAttachmentAdditionalInfoAssociationLogsResponseDTO {
  additionalInfoRegulated: EafAttachmentAdditionalInfoAssociationLogsDTO[];
}

export interface EafConsumptionAddAdditionalInfoRegulatedResponseDTO {
  additionalInfoRegulated: EafAttachmentAdditionalInfoAssociationLogsDTO[];
}

@Injectable({
  providedIn: 'root'
})
export class EafService {

  private apiUrl = `${environment.API_MS_BACKOFFICE}/v1/eafs`;

  constructor(private http: HttpClient) { }

  getEafs(
    name: string,
    fromDate?: string,
    toDate?: string,
    loadStatusId?: string,
    processStatusId?: string,
    page: number = 0,
    size: number = 10
  ): Observable<EafListResponseDTO> {
    // Definir los parámetros de consulta
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('name', name);

    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    if (loadStatusId) params = params.set('loadStatusId', loadStatusId);
    if (processStatusId) params = params.set('processStatusId', processStatusId);

    return this.http.get<EafListResponseDTO>(this.apiUrl, { params });
  }

  getEafDetail(eafId: number): Observable<EafDetailDTO> {
    return this.http.get<EafDetailDTO>(`${this.apiUrl}/${eafId}`);
  }

  updateEaf(eafId: number, eafUpdateDTO: EafUpdateDTO): Observable<EafDetailDTO> {
    return this.http.put<EafDetailDTO>(`${this.apiUrl}/${eafId}`, eafUpdateDTO).pipe();
  }

  private validateFields(obj: any, validationType: 'valid' | 'success'): boolean {
    return Object.keys(obj).every(key => {
      if (obj[key] && typeof obj[key] === 'object' && 'errorLevel' in obj[key]) {
        return validationType === 'valid'
          ? obj[key].errorLevel !== 'danger'
          : obj[key].errorLevel === 'success';
      }
      return true;
    });
  }

  private areFieldsSuccessful(obj: any): boolean {
    for (let key in obj) {
      if (obj[key] && typeof obj[key] === 'object' && 'errorLevel' in obj[key]) {
        if (obj[key].errorLevel !== "success") {
          return false;
        }
      }
    }
    return true;
  }


  isEAFValid(eafDetail: EafDetailDTO): boolean {
    const { eafDTO, header, attachments, consumptions } = eafDetail;
    return (
      (!eafDTO || this.validateFields(eafDTO, 'valid')) &&
      (!header || this.validateFields(header, 'valid')) &&
      (!attachments || attachments.every(att => this.validateFields(att, 'valid'))) &&
      (!consumptions || consumptions.every(cons => this.validateFields(cons, 'valid')))
    );
  }

  needModification(eafDetail: EafDetailDTO): boolean {
    const { eafDTO, header, attachments, consumptions } = eafDetail;
    return (
      (eafDTO && !this.validateFields(eafDTO, 'success')) ||
      (header && !this.validateFields(header, 'success')) ||
      (attachments && attachments.some(att => !this.validateFields(att, 'success'))) ||
      (consumptions && consumptions.some(att => !this.validateFields(att, 'success')))
    );
  }


  mapEafDetailToUpdate(eafDetail: EafDetailDTO): EafUpdateDTO {
    const header = eafDetail.header;
    if (!header) throw new Error('El objeto EafDetailDTO no contiene un header válido.');

    const headerUpdate: EafHeaderUpdateDTO = {
      startDate: header.startDate.value,
      startTime: header.startTime.value,
      segmentTypeId: header.segmentType.value.id || header.segmentType.value.toString(),
      failedElementNemotechnic: header.failedElementNemotechnic.value,
      failedElementId: header.failedElementId.value,
      ownerReucId: header.ownerReucId.value,
      ownerName: header.ownerName.value,
      ownerRut: header.ownerRut.value,
      originCauseDescription: header.originCauseDescription.value,
      edacStatus: header.edacStatus.value,
      edacDescription: header.edacDescription.value
    };

    const attachmentsUpdate: EafAttachmentUpdateDTO[] = eafDetail.attachments.map(attachment => ({
      id: attachment.id,
      eafId: attachment.eafId,
      recordNumber: attachment.recordNumber,
      codeNeomante: attachment.codeNeomante.value,
      substationInfotecnicaId: attachment.substation.value.id,
      substationName: attachment.substation.value.nombre,
      companyInfotecnicaId: attachment.company.value.id,
      companyName: attachment.company.value.nombre,
      uuid: attachment.uuid || ''
    }));

    const consumptionsUpdate: EafConsumptionUpdateDTO[] = eafDetail.consumptions.map(consumption => ({
      id: consumption.id,
      eafHeaderId: consumption.eafHeaderId,
      recordNumber: consumption.recordNumber,
      substationInfotecnicaId: consumption.substation.value.id,
      substationName: consumption.substation.value.nombre,
      feeder: consumption.feeder.value,
      sectionInfotecnicaId: consumption.section.value.id,
      sectionName: consumption.section.value.nombre,
      consumptionLoss: consumption.consumptionLoss.value,
      preFailureAverageConsumption: consumption.preFailureAverageConsumption.value,
      numberOfCustomers: consumption.numberOfCustomers.value,
      companyName: consumption.company.value.nombre,
      companyInfotecnicaId: consumption.company.value.id,
      disconnectionDatetime: consumption.disconnectionDatetime.value,
      availabilityDatetime: consumption.availabilityDatetime.value,
      normalizationDatetime: consumption.normalizationDatetime.value,
      communeConsumptions: consumption.communeConsumptions.value
    }));

    return {
      header: headerUpdate,
      attachments: attachmentsUpdate,
      consumptions: consumptionsUpdate
    };
  }

  getAttachmentAdditionalInfo(attachmentId?: number): Observable<EafAttachmentAdditionalInfoResponseDTO> {
    return this.http.get<EafAttachmentAdditionalInfoResponseDTO>( `${this.apiUrl}/additionalInfo/${attachmentId}`);
  }

  getAttachmentAdditionalInfoRegulatedLogs(additionalInfoId?: number): Observable<EafAttachmentAdditionalInfoRegulatedLogsResponseDTO> {
    return this.http.get<EafAttachmentAdditionalInfoRegulatedLogsResponseDTO>( `${this.apiUrl}/additionalInfoRegulatedLogs/${additionalInfoId}`);
  }

  getAttachmentAdditionalInfoFreeDXLogs(additionalInfoId?: number): Observable<EafAttachmentAdditionalInfoRegulatedLogsResponseDTO> {
    return this.http.get<EafAttachmentAdditionalInfoRegulatedLogsResponseDTO>( `${this.apiUrl}/additionalInfoFreeDXLogs/${additionalInfoId}`);
  }

  getAttachmentAdditionalInfoAssociationLogs(additionalInfoId?: number): Observable<EafAttachmentAdditionalInfoAssociationLogsResponseDTO> {
    return this.http.get<EafAttachmentAdditionalInfoAssociationLogsResponseDTO>( `${this.apiUrl}/additionalInfoAssociatedLogs/${additionalInfoId}`);
  }

  getConsumptionAdditionalInfo(consumptionId?: number): Observable<EafConsumptionAddAdditionalInfoRegulatedResponseDTO> {
    return this.http.get<EafConsumptionAddAdditionalInfoRegulatedResponseDTO>( `${this.apiUrl}/regulatedInfo/${consumptionId}`);
  }

}