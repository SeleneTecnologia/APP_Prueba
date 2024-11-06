import { CommonModule } from '@angular/common';
import { Component, Input, EventEmitter, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-upload-file',
  standalone: true,
  imports: [CommonModule, DialogModule],
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.css']
})
export class UploadFileComponent {
  @Input() label: string = 'Subir Archivo Manual';
  @Input() type: string = 'EAF';
  @Output() onFileUpload: EventEmitter<File> = new EventEmitter<File>(); 
  @Output() onModalOpen: EventEmitter<void> = new EventEmitter<void>();
  @Output() validateStateRequest: EventEmitter<void> = new EventEmitter<void>(); // Nuevo EventEmitter

  selectedFile: File | null = null;
  isModalOpen = false;
  isErrorUploadFile = false;

  getIconClass(): string {
    switch (this.type) {
      case 'EAF':
      case 'FUERZA_MAYOR':
        return 'bi bi-filetype-pdf'; // Ícono para PDF
      case 'DTE':
        return 'bi bi-file-spreadsheet'; // Ícono para Excel
      default:
        return 'bi bi-file-earmark';
    }
  }

  getAcceptedFileTypes(): string {
    switch (this.type) {
      case 'EAF':
      case 'FUERZA_MAYOR':
        return '.pdf';
      case 'DTE':
        return '.xlsx';
      default:
        return '*';
    }
  }

  openModal(): void {
    if (this.type === 'FUERZA_MAYOR') {
      // Emitir el evento para que el componente padre maneje la validación
      this.validateStateRequest.emit();
    } else {
      // Si el tipo no es FUERZA_MAYOR, abrir el modal directamente
      this.showModal();
    }
  }

  // Método para abrir el modal
  showModal(): void {
    this.isModalOpen = true;
    this.onModalOpen.emit();
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedFile = null;
    this.isErrorUploadFile = false;
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('fileUpload');
    if (fileInput) {
      fileInput.click();
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  confirmUpload(): void {
    if (this.selectedFile) {
      console.log('Metadata del archivo:', {
        name: this.selectedFile.name,
        size: this.selectedFile.size,
        type: this.selectedFile.type,
      });

      this.onFileUpload.emit(this.selectedFile);
      this.closeModal();
    }
  }

  isConfirmDisabled(): boolean {
    return !this.selectedFile || this.isErrorUploadFile;
  }
}