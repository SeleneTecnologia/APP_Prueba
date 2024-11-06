import { Component, inject, Input, Output } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-confirm-popup',
  standalone: true,
  imports: [ConfirmDialogModule, ToastModule,DialogModule,ButtonModule],
  templateUrl: './confirm-popup.component.html',
  styleUrl: './confirm-popup.component.css',
  providers: [ConfirmationService, MessageService]
})
export class ConfirmPopupComponent {

  private confirmationService: ConfirmationService = inject(ConfirmationService);
  private messageService: MessageService = inject(MessageService);

  @Input() message: string = '';
  @Input() header: string = '';
  @Input() acceptLabel : string = '';
  @Input() rejectLabel : string = '';
  @Input() acceptMethod : () => void = () => {};
  @Input() rejectMethod : () => void = () => {};
  display: boolean = false;

  confirm(){
    this.confirmationService.confirm({
      message: this.message,
      header: this.header,
      icon: 'pi pi-exclamation-triangle',
      acceptIcon:"none",
      rejectIcon:"none",
      rejectButtonStyleClass:"p-button-text",
      accept: () => {
          this.acceptMethod();
      },
      reject: () => {
          this.rejectMethod();
      }
  });

  }
 
  show(): void {
    this.display = true;
  }

  // Método para aceptar la eliminación
  onAccept(): void {
    this.acceptMethod();
    this.display = false;
  }

  // Método para rechazar la eliminación
  onReject(): void {
    this.rejectMethod();
    this.display = false;
  }  
}
