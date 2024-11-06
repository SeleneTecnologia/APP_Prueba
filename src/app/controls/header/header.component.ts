import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  @Output() toggleMenu = new EventEmitter<void>();
  title = 'NTISyC';
  userName = 'Gabriel Ramos';

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
    const colors = ['#004E7C', '#278C92', '#4F9A29', '#F26D20', '#E93015'];
    const index = name.charCodeAt(0) % colors.length; 
    return colors[index];
  }

  toggleSideMenu() {
    this.toggleMenu.emit();
  }
}