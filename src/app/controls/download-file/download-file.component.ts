import { Component, Input } from '@angular/core';
import { S3Service } from '../../services/s3.service';
import { LoadingService } from '@services/loading.service';

@Component({
  selector: 'cen-download-file',
  standalone: true,
  imports: [],
  templateUrl: './download-file.component.html',
  styleUrl: './download-file.component.css'
})
export class DownloadFileComponent {

  @Input() downloadName: string = "";
  @Input() downloadPath: string = "";
  @Input() downloadButton: string = "";
  @Input() downloadExtension: string = "";
  @Input() downloadTitle: string = "";

  constructor(private s3Service: S3Service,
              private loadingService: LoadingService) 
              {
  }

  downloadFile(name: string, key: string) {
    this.loadingService.loadingOn();
    this.s3Service.proceedWithDownload(key).subscribe({
      next: (downloadResponse) => {
        if (downloadResponse.content instanceof Blob) {
          const url = window.URL.createObjectURL(downloadResponse.content);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${downloadResponse.name}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
      },
      error: (error) => {
        console.error('Error al descargar el archivo:', error);
        const errorMessage = typeof error === 'string' ? error : 'Ocurrió un error al descargar el archivo desde S3';
        this.loadingService.loadingOff();
      },
      complete: () => {
        this.loadingService.loadingOff();
      }
    });
  }

  getStyleClass(): string {
    switch ( this.downloadButton ) {
      case 'blue':
        return 'btn btn-primary custom-button-download';
      case 'red':
        return 'btn btn-danger custom-button-download';
      case 'outline':
        return 'btn btn-outline-primary custom-button-download';
      default:
        return 'btn custom-button-download';
    }
  }  

  
  getTitle(): string {
    if ( this.downloadTitle=='' || this.downloadTitle=='none' ) {
      return 'Descargar archivo'
    }else{
      return this.downloadTitle;
    }
      
    }
  

}