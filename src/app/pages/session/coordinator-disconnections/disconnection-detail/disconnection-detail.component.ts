import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { PageTitleComponent } from '../../../../controls/page-title/page-title.component';
import { CommuneConsumptionDTO, EafAttachmentAdditionalInfoAssociationLogsDTO, EafAttachmentAdditionalInfoRegulatedLogsDTO, EafAttachmentDTO, EafConsumptionConsolidatedDTO, EafDetailDTO, EafSectionStatusDTO, EafService, EafUpdateDTO, ValidatedField } from '../../../../services/eaf.service';
import { catchError, filter, finalize, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
import { LoadingService } from '../../../../services/loading.service';
import { ValidatedInputComponent } from '../../../../controls/validated-input/validated-input.component';
import { SegmentTypeDTO, SegmentTypeService } from '../../../../services/segment-type.service';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { Commune, Installation, InstallationService, InstallationTypeDTO } from '../../../../services/installation.service';
import { ReucCoordinatedDTO, ReucCoordinatedService } from '../../../../services/reuc-coordinated.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';
import { DialogModule } from 'primeng/dialog';
import { ReplaceDotWithCommaPipe } from '../../../../pipes/replace-dot-with-comma.pipe';
import { DropdownModule } from 'primeng/dropdown';
import { DownloadFileComponent } from '@controls/download-file/download-file.component';

@Component({
  selector: 'app-disconnection-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitleComponent, TableModule, ValidatedInputComponent, AutoCompleteModule, ConfirmDialogModule, ToastModule, ButtonModule, MultiSelectModule, DialogModule, ReplaceDotWithCommaPipe, DropdownModule, DownloadFileComponent],
  templateUrl: './disconnection-detail.component.html',
  styleUrl: './disconnection-detail.component.css',
  providers: [ConfirmationService, MessageService, DatePipe]
})
export class DisconnectionDetailComponent implements OnInit {
  COMPANY_REGULATED_TYPE: number = 3;

  eafId: number | null = null;
  eafDetailDto: EafDetailDTO = { attachments: [], consumptions: [], sectionStatuses: [] };
  segmentTypes: SegmentTypeDTO[] = [];
  coordinated: ReucCoordinatedDTO[] = [];
  communes: Commune[] = [];
  segmentTypeId: string | null = null;
  installationTypes: InstallationTypeDTO[] = [];
  selectedElementType: InstallationTypeDTO | null = null;
  filteredOptions: Installation[] = [];
  substations: Installation[] = [];
  panos: Installation[] = [];
  companies: Installation[] = [];
  regulatedCompanies: Installation[] = [];
  selectedElementId: ValidatedField<number> = { value: 0, validationDescription: '', errorDescription: '', errorLevel: '' };
  selectedCoordinatedError: ValidatedField<string> = { value: '', validationDescription: '', errorDescription: 'Debe seleccionar valor', errorLevel: 'danger' };
  inputCoordinatedError: ValidatedField<any> = { value: null, validationDescription: '', errorDescription: 'Debe ingresar valor', errorLevel: 'danger' };
  selectedCoordinatedRUT: ValidatedField<string> = { value: '', validationDescription: '', errorDescription: '', errorLevel: '' };
  defaultElement: ValidatedField<any> = { value: '', validationDescription: '', errorDescription: '', errorLevel: '' };
  defauselected: Installation = { id: 0, nombre: '' };
  defaultPanos = []
  maxDate: string= '';

  selectedSubstationId: number = 0;

  isModalOpen = false;
  titleModal = '';

  additionalInfoLogs: EafAttachmentAdditionalInfoRegulatedLogsDTO[] = [];
  
  errors: string[] = [];  

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eafService: EafService,
    private segmentTypeService: SegmentTypeService,
    private installationService: InstallationService,
    private reucCoordinatedService: ReucCoordinatedService,
    private loadingService: LoadingService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    this.route.params.pipe(
      tap(params => {
        this.eafId = +params['id'];
        this.loadingService.loadingOn();
      }),
      switchMap(() => forkJoin([
        this.getCommunes(),
        this.getSegmentTypes(),
        this.getInstallationTypes(),
        this.getCoordinated(),
        this.getEafDetailDto(this.eafId),
        this.getSubstations(),
        this.getCompanies()
      ])),
      finalize(() => {
        this.loadingService.loadingOff()
      }),
      catchError((err) => {
        console.error('Error en la llamada de servicios:', err);
        this.messageService.add({ severity: 'error', summary: 'ERROR', detail: 'Ocurrió un error al obtener el formulario. Intente nuevamente.' });
        return of([]);  // Devuelve un valor por defecto para manejar el error
      })
    ).subscribe(() => this.loadingService.loadingOff());  // No necesita manejar ningún resultado directamente

    const today = new Date();
    this.maxDate = today.toISOString().slice(0, 16);
  }

  getCommunes() {
    return this.getData(
      () => this.installationService.getCommunes(),
      (data) => { this.communes = data || []; this.setCommuneDescriptions(this.eafDetailDto, this.communes) },  // Maneja el caso de null aquí
      'get communes'
    );
  }

  getSubstations() {
    return this.getData(
      () => this.installationService.getInfoTecnica('/v1/subestaciones'),
      (data) => { this.substations = data; this.setSubstation(this.eafDetailDto) },
      'get substations'
    );
  }

  getCompanies() {
    return this.getData(
      () => this.installationService.getInfoTecnica('/v1/empresas'),
      (data) => { this.companies = data; this.regulatedCompanies = data.filter(x => x.id_giro === this.COMPANY_REGULATED_TYPE) },
      'get companies'
    );
  }

  getSegmentTypes() {
    return this.getData(
      () => this.segmentTypeService.getSegmentTypes(),
      (data) => { this.segmentTypes = data; },
      'get segment types'
    );
  }

  getCoordinated() {
    return this.getData(
      () => this.reucCoordinatedService.getAllReucCoordinated(),
      (data) => { this.coordinated = data; },
      'get coordinated'
    );
  }

  getInstallationTypes() {
    return this.getData(
      () => this.installationService.getAllInstallationTypes(),
      (data) => { this.installationTypes = data; },
      'get installation types'
    );
  }

  getEafDetailDto(eafId: any): Observable<EafDetailDTO> {
    return this.eafService.getEafDetail(eafId).pipe(
      tap((data) => {
        if (data) {
          this.eafDetailDto = data;
          if (this.eafDetailDto.header && this.eafDetailDto.header.startTime.value) {
            this.eafDetailDto.header.startTime.value = this.eafDetailDto.header.startTime.value.substring(0, 5);
          }
          this.segmentTypeId = this.eafDetailDto.header?.segmentType?.value?.id || null;
          this.setCommuneDescriptions(this.eafDetailDto, this.communes);
          this.setSectionDescription(this.eafDetailDto);
        }
      }),
      catchError((err) => {
        console.error('Error get EAF:', err);
        return of(null);
      }),
      filter((data): data is EafDetailDTO => data !== null),
      switchMap((data) => {
        if (!data.attachments || data.attachments.length === 0) {
          return of(data);
        }        
        const attachmentObservables = data.attachments.map(attachment => {
          return this.eafService.getAttachmentAdditionalInfo(attachment.id || 0).pipe(
            tap((attachmentData) => {
              if (attachmentData) {
                attachment.additionalInfos = attachmentData.additionalInfos;
              }
            }),
            catchError((err) => {
              console.error('Error fetching attachment additional info:', err);
              return of(null);
            })
          );
        }) || [];
        
        const consumptionObservables = data.consumptions?.map(consumption => {
          return this.eafService.getConsumptionAdditionalInfo(consumption.id || 0).pipe(
            tap((consumptionData) => {
              if (consumptionData) {
                consumption.additionalInfoRegulated = consumptionData.additionalInfoRegulated;
              }
            }),
            catchError((err) => {
              console.error('Error fetching consumption additional info:', err);
              return of(null);
            })
          );
        }) || [];
  
        // Ejecutar ambos observables en paralelo (si existen attachments o consumptions)
        return forkJoin([...attachmentObservables, ...consumptionObservables]).pipe(
          map(() => data) // Retornar el EafDetailDTO después de obtener toda la información adicional
        );
      })
    );
  }

  getData<T>(
    serviceMethod: () => Observable<T>,
    successCallback: (data: T) => void,
    errorMessage: string
  ): Observable<T | null> {  // Cambia el tipo de retorno a Observable<T | null>
    return serviceMethod().pipe(
      tap(successCallback),
      catchError((err) => {
        console.error(`Error ${errorMessage}:`, err);
        return of(null);  // Devuelve null en caso de error
      })
    );
  }

  getPanoBySubstation(consumption: EafConsumptionConsolidatedDTO) {
    this.loadingService.loadingOn();
    this.installationService.getInfoTecnica(`/v1/panos?id_subestacion=${consumption.substation.value.id}`).pipe(
      finalize(() => {
        this.loadingService.loadingOff();
      })
    ).subscribe(
      (data) => {
        consumption.sectionList = data;
        consumption.section.value = data.find(x => x.id === consumption.section.value.id);
      },
      (err) => {
        console.error('Error get InfoTecnica:', err);
      }
    );

  }

  setCommuneDescriptions(eafDetailDto: EafDetailDTO, communes: Commune[]): void {
    const communeMap = new Map<number, string>();
    communes.forEach(commune => {
      communeMap.set(commune.id, commune.name);
    });

    eafDetailDto.consumptions.forEach((consumption) => {
      consumption.communeConsumptions.value.forEach((communeConsumption) => {
        const description = communeMap.get(communeConsumption.infotecnicaCommuneId);
        if (description) {
          communeConsumption.communeDescription = description;
        }
      });
    });
  }

  setSectionDescription(eafDetailDto: EafDetailDTO) {
    eafDetailDto.consumptions.forEach((consumption) => {
      if (consumption && consumption.section.errorLevel === 'warning') {
        consumption.sectionList = [];
        consumption.sectionList.push(consumption.section.value);
      }
    });
  }

  setSubstation(eafDetailDto: EafDetailDTO) {
    eafDetailDto.consumptions.forEach((consumption) => {
      if (consumption && consumption.substation.value.id && consumption.substation.errorLevel === 'warning') {
        consumption.substation.value = this.substations.find(x => x.id === consumption.substation.value.id)
      }
    });
  }


  onCommunesChange(fieldName: string, communes: any[], recordNumber: number) {
    const communesConsumption: CommuneConsumptionDTO[] = communes.map(commune => ({

      infotecnicaCommuneId: commune.id,
      communeDescription: commune.name
    }));

    const consumption = this.eafDetailDto.consumptions.find(c => c.recordNumber === recordNumber);
    this.setFieldValue(consumption, fieldName, communesConsumption);
  }

  onFieldValueChanged(section: string, fieldName: string, newValue: any, recordNumber: number = 0): void {

    let targetObject: any;

    switch (section) {
      case 'header':
        targetObject = this.eafDetailDto.header;
        break;
      case 'attachments':
        targetObject = this.eafDetailDto.attachments?.find(option => option.recordNumber === recordNumber);
        break;
      case 'consumptions':
        targetObject = this.eafDetailDto.consumptions?.find(option => option.recordNumber === recordNumber);
        break;
      default:
        return;
    }

    this.setFieldValue(targetObject, fieldName, newValue);
  }


  getCellClass(value: any): string {
    return value && value !== 'success' ? `bg-custom-${value}` : '';
  }

  getFieldClass(value: any): string {
    return value ? `is-${value}` : '';
  }


  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'Aprobado':
        return 'bg-success';
      case 'Pendiente':
        return 'bg-warning';
      case 'Rechazado':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  onSectionFocus(consumption: EafConsumptionConsolidatedDTO) {
    if (consumption?.substation.value.id) {
      this.getPanoBySubstation(consumption);
    }

  }

  getIconClass(field: any): string {
    switch (field.errorLevel) {
      case 'danger':
        return 'bi-x-circle-fill text-danger';
      case 'warning':
        return 'bi-exclamation-triangle-fill text-warning';
      default:
        return '';
    }
  }

  onItemSelected(
    sourceArray: any[], // Array desde el cual seleccionar el elemento
    selectedItemValue: any, // Valor que estamos seleccionando
    firstField: string, // 1er Campo en el DTO que queremos actualizar
    secondField: string, // 2do Campo en el DTO que queremos actualizar
    thirdField: string, // 3er Campo en el DTO que queremos actualizar
    section: string, // Sección dentro del DTO
    recordNumber: number = 0 // Número de registro si es necesario
  ) {
    const selectedItem = sourceArray.find(item => item.nombre === selectedItemValue || item.legalName === selectedItemValue || item.nemotecnico === selectedItemValue);

    if (selectedItem) {
      let targetObject: any;

      switch (section) {
        case 'header':
          targetObject = this.eafDetailDto.header;
          break;
        case 'attachments':
          targetObject = this.eafDetailDto.attachments?.find(option => option.recordNumber === recordNumber);
          break;
        case 'consumptions':
          targetObject = this.eafDetailDto.consumptions?.find(option => option.recordNumber === recordNumber);
          break;
        default:
          return;
      }

      this.setFieldValue(targetObject, firstField, selectedItem.nombre || selectedItem.legalName);
      if (secondField) {
        this.setFieldValue(targetObject, secondField, selectedItem.id);
      }
      if (thirdField) {
        this.setFieldValue(targetObject, thirdField, selectedItem.rut);
      }
    }
  }

  setFieldValue(targetObject: any, fieldName: string, newValue: any) {
    if (targetObject && targetObject[fieldName]) {
      targetObject[fieldName].value = newValue;
      targetObject[fieldName].errorLevel = '';
      targetObject[fieldName].errorDescription = '';
      targetObject[fieldName].validationDescription = '';
    }
  }

  onNemotechnicSelected(fieldName: string, selectedItem: string): void {
    this.onItemSelected(this.filteredOptions, selectedItem, fieldName, 'failedElementId', '', 'header');
  }

  onCommunesSelected(section: string, fieldName: string, selectedItem: Commune[], consumption: EafConsumptionConsolidatedDTO): void {
    const communesDTO: CommuneConsumptionDTO[] = selectedItem.map(c => ({
      infotecnicaCommuneId: c.id,
      communeDescription: c.name
    }))
    consumption.communeConsumptions.value = communesDTO;
  }

  onCoordinatedSelected(section: string, fieldName: string, selectedItem: string, recordNumber: number = 0): void {
    this.onItemSelected(this.coordinated, selectedItem, fieldName, 'ownerReucId', 'ownerRut', section, recordNumber);
  }


  addNewAttachment(): void {
    const newAttachment: EafAttachmentDTO = {
      recordNumber: this.eafDetailDto.attachments.length + 1, // Asegurarse que tenga un recordNumber único
      codeNeomante: { value: '', validationDescription: '', errorDescription: 'Debe ingresar valor', errorLevel: 'danger' },
      substation: { value: { id: 0, nombre: '' }, validationDescription: '', errorDescription: 'Debe ingresar valor', errorLevel: 'danger' },
      company: { value: { id: 0, nombre: '' }, validationDescription: '', errorDescription: 'Debe ingresar valor', errorLevel: 'danger' },
      eafId: this.eafId || 0, additionalInfos: []
    };

    if (!this.eafDetailDto.attachments.find(x => x.company.value.id == 0)) {
      this.eafDetailDto.attachments.push(newAttachment);
    }
  }

  addNewConsumption(): void {
    const newAttachment: EafConsumptionConsolidatedDTO = {
      recordNumber: this.eafDetailDto.consumptions.length + 1, // Asegurarse que tenga un recordNumber único
      eafHeaderId: this.eafDetailDto.header?.id || 1,
      substation: { value: { id: 0, nombre: '' }, validationDescription: '', errorDescription: 'Debe ingresar valor', errorLevel: 'danger' },
      feeder: { value: '', validationDescription: '', errorDescription: 'Debe ingresar valor', errorLevel: 'danger' },
      section: { value: { id: 0, nombre: '' }, validationDescription: '', errorDescription: 'Debe ingresar valor', errorLevel: 'danger' },
      consumptionLoss: { value: 0, validationDescription: '', errorDescription: 'Debe ingresar valor', errorLevel: 'danger' },
      preFailureAverageConsumption: { value: 0, validationDescription: '', errorDescription: 'Debe ingresar valor', errorLevel: 'danger' },
      numberOfCustomers: { value: 0, validationDescription: '', errorDescription: 'Debe ingresar valor', errorLevel: 'danger' },
      company: { value: { id: 0, nombre: '' }, validationDescription: '', errorDescription: 'Debe ingresar valor', errorLevel: 'danger' },
      unavailabilityTime: { value: 0, validationDescription: '', errorDescription: '', errorLevel: '' },
      disconnectionTime: { value: 0, validationDescription: '', errorDescription: '', errorLevel: '' },
      energyNotSupplied: { value: 0, validationDescription: '', errorDescription: '', errorLevel: '' },
      disconnectionDatetime: { value: '', validationDescription: '', errorDescription: 'Debe ingresar valor', errorLevel: 'danger' },
      availabilityDatetime: { value: '', validationDescription: '', errorDescription: 'Debe ingresar valor', errorLevel: 'danger' },
      normalizationDatetime: { value: '', validationDescription: '', errorDescription: 'Debe ingresar valor', errorLevel: 'danger' },
      communeConsumptions: { value: [], validationDescription: '', errorDescription: 'Debe ingresar valor', errorLevel: 'danger' },
      additionalInfoRegulated: []
    };

    if (!this.eafDetailDto.consumptions.find(x => x.company.value.id == 0)) {
      this.eafDetailDto.consumptions.push(newAttachment);
    }
  }

  removeAttachment(index: number): void {
    this.eafDetailDto.attachments.splice(index, 1);
  }

  removeConsumption(index: number): void {
    this.eafDetailDto.consumptions.splice(index, 1);
  }


  onElementTypeSelected(elementTypeDescription: string): void {
    const elementType = this.installationTypes.find(type => type.id === +elementTypeDescription);
    if (elementType && elementType.endpoint) {
      this.loadingService.loadingOn();
      this.installationService.getInfoTecnica(elementType.endpoint).pipe(
        finalize(() => {
          this.loadingService.loadingOff();
        })
      ).subscribe(
        (data) => {
          this.selectedElementType = elementType;
          this.filteredOptions = data;
        },
        (err) => {
          console.error('Error get InfoTecnica:', err);
        }
      );
    }
  }

  canSave(): boolean {
    return this.eafService.isEAFValid(this.eafDetailDto)
      && this.eafService.needModification(this.eafDetailDto);
  }

  onSave() {
    if (this.eafId) {
      const id = this.eafId;
      const eafUpdateDTO: EafUpdateDTO = this.eafService.mapEafDetailToUpdate(this.eafDetailDto);
      this.loadingService.loadingOn();
      this.eafService.updateEaf(this.eafId, eafUpdateDTO)
        .pipe(
          finalize(() => {
            this.loadingService.loadingOff();
            this.getEafDetailDto(id);
          })
        ).subscribe(
          (data) => {
            this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Formulario guardado.' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
            this.ngOnInit();

          },
          (err) => {
            console.error('Error get InfoTecnica:', err);
            this.messageService.add({ severity: 'error', summary: 'ERROR', detail: 'Ocurrió un error al guardar el formulario.' });
          }
        );
    }
  }

  onBack(): void {
    this.router.navigate(['/desconexiones']);
  }

  confirmSave() {
    this.confirmationService.confirm({
      message: '¿Está seguro que desea guardar el formulario?',
      header: 'Confirmación',
      icon: 'pi pi-exclamation-triangle',
      acceptIcon: "none",
      rejectIcon: "none",
      acceptLabel: "Sí",
      rejectLabel: "No",
      rejectButtonStyleClass: "p-button-text",
      accept: () => {
        this.onSave();
      },
      reject: () => {
        return;
      }
    });
  }

  getSectionStatus(sectionName: string): EafSectionStatusDTO {
    const sectionStatus = this.eafDetailDto.sectionStatuses.find(status => status.sectionName === sectionName);
    return sectionStatus ? sectionStatus : { eafId: 0, sectionName: sectionName, validationType: { level: 'success', description: 'Válido' } };
  }

  openModal(id: number, title: string, type: string): void {
    this.additionalInfoLogs = [];
    this.titleModal = title;    

    switch(type) {
      case 'validation':
        this.getAttachmentAdditionalInfoRegulatedLogs(id);
        break;
        case 'association':
          this.getAttachmentAdditionalInfoAssociationLogs(id);
          break;  
      case 'dx':
        this.getAttachmentAdditionalInfoFreeDXLogs(id);
        break;
    }    
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  getAttachmentAdditionalInfoRegulatedLogs(additionalInfoId: number) {    
    return this.eafService.getAttachmentAdditionalInfoRegulatedLogs(additionalInfoId).pipe(
      finalize(() => {
        this.isModalOpen = true;
      })
    ).subscribe(
      ( data ) => {
        this.additionalInfoLogs = data.additionalInfoLogs;
      },
      (err) => {
        console.error('Error get logs:', err);
      }
    );
  }

  getAttachmentAdditionalInfoFreeDXLogs(additionalInfoId: number) {
    return this.eafService.getAttachmentAdditionalInfoFreeDXLogs(additionalInfoId).pipe(
      finalize(() => {
        this.isModalOpen = true;
      })
    ).subscribe(
      ( data ) => {
        this.additionalInfoLogs = data.additionalInfoLogs;
      },
      (err) => {
        console.error('Error get logs:', err);
      }
    );
  }

  getAttachmentAdditionalInfoAssociationLogs(additionalInfoId: number) {    
    return this.eafService.getAttachmentAdditionalInfoAssociationLogs (additionalInfoId).pipe(
      finalize(() => {
        this.isModalOpen = true;
      })
    ).subscribe(
      ( data ) => {
        this.additionalInfoLogs = this.mappingResponseAssociated(data.additionalInfoRegulated);
      },
      (err) => {
        console.error('Error get logs:', err);
      }
    );
  }  

  disconnectionMaxDate(consumption: EafConsumptionConsolidatedDTO): string {
    const { availabilityDatetime, normalizationDatetime } = consumption;
  
    if (availabilityDatetime.value && normalizationDatetime.value) {
      return availabilityDatetime.value > normalizationDatetime.value 
        ? normalizationDatetime.value 
        : availabilityDatetime.value;
    }
  
    return availabilityDatetime.value || normalizationDatetime.value || this.maxDate;
  }

  mappingResponseAssociated(responseOrigin: EafAttachmentAdditionalInfoAssociationLogsDTO[]): EafAttachmentAdditionalInfoRegulatedLogsDTO[] {
    let responseAssociated: EafAttachmentAdditionalInfoRegulatedLogsDTO[] = []
    let message = '';
    
    responseOrigin.forEach(element => {
      if ( element.associated === 0 ) {
        if ( element.busbarInfotecnicaId )
          message += `El ID Barra ${element.busbarInfotecnicaId} no esta asociado; `

        if ( element.sectionInfotecnicaId )
          message += `El ID Paño ${element.sectionInfotecnicaId} no esta asociado; `

        if ( element.feeder )
          message += `El Alimentador ${element.feeder} no esta asociado; `

        if ( element.communes )
          message += `La Comuna ${element.communes} no esta asociado; `

        if ( element.consumptionLoss )
          message += `La Pérdida de consumo ${element.consumptionLoss} no esta asociado; `


        responseAssociated.push({"id": 0, "coordinatedAdditionalInfoId": "0", "errorDescription": message, "recordNumber": 0});
        message = "";
      }
    });
    
    return responseAssociated;
  }  

  formatDate(date: Date): string | null {
    return this.datePipe.transform(date, 'dd-MM-yyyy HH:mm') ;
  }    

}