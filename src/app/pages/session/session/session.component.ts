import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from "../../../controls/header/header.component";
import { SideMenuComponent } from "../../../controls/side-menu/side-menu.component";  

@Component({
  selector: 'app-session',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SideMenuComponent],
  templateUrl: './session.component.html',
  styleUrl: './session.component.css'
})
export default class SessionComponent {
  isMenuCollapsed = false;

  toggleMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }
}