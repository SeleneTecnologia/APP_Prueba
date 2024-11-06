import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ValidatedField } from '../../services/eaf.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { DropdownModule } from 'primeng/dropdown';
import { Installation } from '@services/installation.service';
import { ReturnStatement } from '@angular/compiler';

@Component({
  selector: 'app-validated-text-input',
  standalone: true,
  imports: [CommonModule, FormsModule, MultiSelectModule, DropdownModule],
  templateUrl: './validated-input.component.html',
  styleUrl: './validated-input.component.css'
})

export class ValidatedInputComponent implements OnInit {
  @Input() field?: ValidatedField<any>;
  @Input() idSelected?: number;
  @Input() recordNumber?: number;
  @Input() input?: string;
  @Input() minDate?: string;
  @Input() maxDate?: string;
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() inputType: string = 'text';
  @Input() isDefaultDisabled: boolean = false;
  @Input() values?: any[] = [];

  filteredOptions: any[] = [];
  isSelectionMade: boolean = false;
  idInput: string = '';
  selected: Installation = {id:0, nombre:''};
  selectedValues: any[] = [];

  @Output() valueChanged = new EventEmitter<any>(); 

  ngOnInit(): void {
    this.idInput = `id-${this.input}-${this.recordNumber}`
    this.selected = {id:this.idSelected || 0,nombre:this.field?.value || ''};
  }

  getFieldClass(): string {
    if(this.label && this.label !== '') {
      return this.field?.errorLevel ? `is-${this.field.errorLevel}` : '';
    } 
    return '';
  }

  getIconClass(): string {
    switch (this.field?.errorLevel) {
      case 'danger':
        return 'bi-x-circle-fill text-danger';
      case 'warning':
        return 'bi-exclamation-triangle-fill text-warning';
      default:
        return '';
    }
  }

  filterOptions(event: any) {
    const query = event.query;
    if (this.values) {
      this.filteredOptions = this.values.filter(option =>
        option.toLowerCase().includes(query.toLowerCase())
      );
    }

  }

  isDisabled(): boolean {
    return this.field?.errorLevel === 'success' || this.isSelectionMade || this.isDefaultDisabled;
  }


  shouldShowError(): boolean {
    return this.field?.errorLevel !== 'success';
  }

  blockNegativeInput(event: KeyboardEvent): void {
    const invalidChars = ['-', '+', 'e', '.', ','];
  if (invalidChars.includes(event.key)) {
    event.preventDefault();
  }
  }

  onInputChange(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;

    if (inputValue) {
      if(this,this.inputType === 'datetime' && (new Date(inputValue|| '') < new Date(this.minDate || '') || new Date(inputValue|| '') > new Date(this.maxDate || '')) ){
        if(this.field) {
          this.field.value = '';
          this.field.errorLevel = 'danger';
          this.field.errorDescription = 'Fecha ingresada no es v\u00e1lida';
        }
        return;
      }
        this.valueChanged.emit(inputValue);

    } else if (this.field) {
      this.field.value = '';
      this.field.errorLevel = 'danger';
      this.field.errorDescription = 'Debe ingresar valor';

    }
  }
  onAutocompleteChange(event: Event, key: string): void {
    const inputValue = (event.target as HTMLInputElement).value;
   
    if (inputValue && this.values?.find(v => v[key] === inputValue)) {
      this.valueChanged.emit(inputValue);
      this.isSelectionMade = true;
    }
  }

  resetSelection(): void {
    this.isSelectionMade = false;
    if (this.field?.value) {
      this.field.value = '';
      this.field.errorLevel = 'danger';
      this.field.errorDescription = 'Debe ingresar valor';
      this.valueChanged.emit('');
    }

  }

  onchangeMultiSelect(){
    this.valueChanged.emit(this.selectedValues);
  }

  onAutocompleteSelectionChange(selectedValue: any) {
    console.log(selectedValue)
    this.valueChanged.emit(selectedValue);
  }

}