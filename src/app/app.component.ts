import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoadingIndicatorComponent } from './controls/loading-indicator/loading-indicator.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, LoadingIndicatorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'NTISyC';
  userName = 'Usuario Anónimo'; // Reemplaza con la lógica para obtener el nombre del usuario

  logout() {
    // Lógica para cerrar sesión
    console.log('Cerrando sesión...');
  }

  getInitials(name: string): string {
    const names = name.split(' ');
    return names.length > 1
      ? names[0][0].toUpperCase() + names[1][0].toUpperCase()
      : names[0][0].toUpperCase();
  }

  getAvatarColor(name: string): string {
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6'];
    const index = name.charCodeAt(0) % colors.length; // Cambia el color según la primera letra
    return colors[index];
  }
}