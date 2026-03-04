// app.ts
// Root component - handles navbar state, logout, and notification badge

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { AuthService } from './services/auth';
import { NotificationService } from './services/notification';
import { FooterComponent } from './components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, FooterComponent],
  templateUrl: './app.html',
})
export class App implements OnInit {
  isLoggedIn = false;
  currentUser: any = null;
  unreadCount: number = 0;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    // Subscribe to auth so the navbar updates when user logs in or out
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
    });

    // Subscribe to unread count so the badge updates automatically
    this.notificationService.unreadCount$.subscribe((count: number) => {
      this.unreadCount = count;
    });
  }

  // Logs the user out and redirects to login
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}