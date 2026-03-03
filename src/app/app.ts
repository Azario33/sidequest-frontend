// app.ts
// This is the root component of the SideQuest application
// It handles the global navbar state and logout functionality
// The navbar is defined in app.html and is visible on every page

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { AuthService } from './services/auth';
import { FooterComponent } from './components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, FooterComponent],
  templateUrl: './app.html',
})
export class App implements OnInit {
  // Tracks whether the user is currently logged in (controls navbar display)
  isLoggedIn = false;

  // Stores the current user object (used to show username and role in navbar)
  currentUser: any = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    // Subscribe to the auth service so the navbar updates automatically
    // whenever the user logs in or out
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
    });
  }

  // Logs the user out and redirects them to the login page
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}