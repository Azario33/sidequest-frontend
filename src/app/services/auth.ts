// auth.ts
// This service handles everything related to authentication
// It manages login, registration, logout and storing the user session

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Base URL for all auth related API requests
  private baseUrl = 'http://127.0.0.1:8000/api';

  // BehaviorSubject keeps track of the current logged in user
  // Any component that subscribes to currentUser$ will update automatically when it changes
  private currentUserSubject = new BehaviorSubject<any>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // On startup, check if a user session is already saved in localStorage
    // This keeps the user logged in after a page refresh
    const user = localStorage.getItem('user');
    if (user) this.currentUserSubject.next(JSON.parse(user));
  }

  // Sends registration data to the backend and saves the session on success
  register(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register/`, data).pipe(
      tap((res: any) => this.saveSession(res))
    );
  }

  // Sends login credentials to the backend and saves the session on success
  login(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login/`, data).pipe(
      tap((res: any) => this.saveSession(res))
    );
  }

  // Clears the session from localStorage and resets the current user
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  // Returns true if a token exists in localStorage (user is logged in)
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  // Returns the JWT token from localStorage
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Returns the current user object directly from the BehaviorSubject
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  // Updates the stored user object after an email change
  // Also updates the BehaviorSubject so any subscribed components reflect the change
  updateStoredUser(user: any) {
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  // Updates the stored JWT token after a password change
  // Keeps the user logged in without requiring them to log in again
  updateStoredToken(token: string) {
    localStorage.setItem('token', token);
  }

  // Saves the token and user data to localStorage after login or registration
  // Also updates the BehaviorSubject so all subscribed components update
  private saveSession(res: any) {
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
  }
}