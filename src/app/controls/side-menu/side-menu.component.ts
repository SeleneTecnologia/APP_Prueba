import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-side-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './side-menu.component.html',
  styleUrl: './side-menu.component.css'
})
export class SideMenuComponent implements OnInit {

  @Input()
  isCollapsed: boolean = false;
  option: string = '';

  constructor(public router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    // Detect changes in the route and update the selected option
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const currentRoute = this.activatedRoute.firstChild?.snapshot.url[0]?.path;
      this.option = currentRoute || '';  // Update the option based on the URL
    });
  }

  get currentUrl(): string {
    return this.router.url;
  }

  toggleMenu() {
    this.isCollapsed = !this.isCollapsed;
  }

  showOption(option: string) {
    this.option = option;
    this.router.navigateByUrl(`/sesion/${option}`).then();
  }
}