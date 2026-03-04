// notification.ts
// Handles fetching notifications and the unread badge count
// Polls the backend every 30 seconds to keep the badge count fresh

import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private baseUrl = 'http://127.0.0.1:8000/api';

  // Drives the badge count in the navbar
  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  private pollSubscription: Subscription | null = null;

  constructor(private http: HttpClient, private authService: AuthService) {
    // Start polling when a user is logged in, stop when they log out
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.fetchUnreadCount();
        this.startPolling();
      } else {
        this.stopPolling();
        this.unreadCountSubject.next(0);
      }
    });
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  // Fetches all notifications for the notifications page
  getNotifications() {
    return this.http.get<any[]>(`${this.baseUrl}/notifications/`, { headers: this.getHeaders() });
  }

  // Fetches just the unread count for the navbar badge
  fetchUnreadCount() {
    if (!this.authService.isLoggedIn()) return;
    this.http.get<{ count: number }>(`${this.baseUrl}/notifications/unread-count/`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => this.unreadCountSubject.next(res.count),
        error: () => {}
      });
  }

  // Marks all notifications as read and resets the badge
  markAllRead() {
    return this.http.patch(`${this.baseUrl}/notifications/mark-all-read/`, {}, { headers: this.getHeaders() });
  }

  // Marks a single notification as read
  markRead(id: number) {
    return this.http.patch(`${this.baseUrl}/notifications/${id}/read/`, {}, { headers: this.getHeaders() });
  }

  // Resets badge to 0 locally after visiting the notifications page
  clearBadge() {
    this.unreadCountSubject.next(0);
  }

  // Polls the backend every 30 seconds to keep the badge up to date
  private startPolling() {
    this.stopPolling();
    this.pollSubscription = interval(30000).subscribe(() => {
      this.fetchUnreadCount();
    });
  }

  private stopPolling() {
    this.pollSubscription?.unsubscribe();
    this.pollSubscription = null;
  }

  ngOnDestroy() {
    this.stopPolling();
  }
}