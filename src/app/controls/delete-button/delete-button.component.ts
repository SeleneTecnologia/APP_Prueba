// delete-button.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { ForceMajeureService, DeletionResponseDTO } from '@services/force-majeure.service';
import { LoadingService } from '@services/loading.service';

@Component({
  selector: 'app-delete-button',
  standalone: true,
  imports: [ButtonModule, DialogModule],
  templateUrl: './delete-button.component.html',
  styleUrls: ['./delete-button.component.css'],
  providers: [MessageService]
})
export class DeleteButtonComponent {
  
  @Input() id!: number; // ID del evento a eliminar
  @Input() deleteLabel: string = 'Eliminar'; // Etiqueta opcional para el botón

  @Output() deleted = new EventEmitter<number>(); // Evento para notificar al padre

  displayConfirm: boolean = false;

  constructor(
    private forceMajeureService: ForceMajeureService,
    private messageService: MessageService,
    private loadingService: LoadingService
  ) {}

  // Método para mostrar el popup de confirmación
  showConfirm(): void {
    this.displayConfirm = true;
  }

  // Método para manejar la confirmación de eliminación
  confirmDelete(): void {
    this.displayConfirm = false;
    this.loadingService.loadingOn();
    this.forceMajeureService.deleteForceMajeureEventById(this.id).subscribe({
      next: (response: DeletionResponseDTO) => {
        if (response.success) {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: response.message });
          this.deleted.emit(this.id); // Emitir el evento aquí
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: response.message });
        }
      },
      error: (error) => {
        console.error('Error al eliminar el evento de fuerza mayor:', error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el evento de fuerza mayor.' });
      },
      complete: () => {
        this.loadingService.loadingOff();
      }
    });
  }

  // Método para cancelar la eliminación
  cancelDelete(): void {
    this.displayConfirm = false;
    this.messageService.add({ severity: 'info', summary: 'Cancelado', detail: 'La eliminación ha sido cancelada.' });
  }
}
