// api.ts
// This service handles all HTTP requests to the Django backend
// It acts as the main communication layer between the frontend and the API

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // Base URL for all API requests
  private baseUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  // Builds the authorization header using the JWT token stored in localStorage
  // This is attached to any request that requires the user to be logged in
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // --- Service Methods ---

  // Fetches all available services (public, no auth required)
  getServices(): Observable<any> {
    return this.http.get(`${this.baseUrl}/services/`);
  }

  // Fetches a single service by ID (used on the service detail page)
  getService(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/services/${id}/`);
  }

  // Creates a new service listing for the logged in provider
  createService(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/services/create/`, data, { headers: this.getHeaders() });
  }

  // Updates an existing service listing (only the provider who owns it can do this)
  updateService(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/services/${id}/update/`, data, { headers: this.getHeaders() });
  }

  // Deletes a service by ID (only the provider who owns it can do this)
  deleteService(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/services/${id}/`, { headers: this.getHeaders() });
  }

  // --- Provider Methods ---

  // Fetches all provider profiles (public, used on the providers page)
  getProviders(): Observable<any> {
    return this.http.get(`${this.baseUrl}/providers/`);
  }

  // Fetches a single provider profile by ID
  getProvider(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/providers/${id}/`);
  }

  // Updates the logged in provider's profile (bio, location, availability)
  updateProviderProfile(data: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/providers/profile/update/`, data, { headers: this.getHeaders() });
  }

  // Updates the provider's map location (latitude, longitude and service_area)
  updateProviderLocation(data: { latitude: number, longitude: number, service_area: string }): Observable<any> {
    return this.http.patch(`${this.baseUrl}/providers/profile/update/`, data, { headers: this.getHeaders() });
  }

  // --- User Methods ---

  // Fetches all users (used for admin purposes)
  getUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/`);
  }

  // Updates the logged in user's email and/or password
  updateAccountSettings(data: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/auth/settings/`, data, { headers: this.getHeaders() });
  }

  // --- Password Reset Methods ---

  // Sends a 6-digit reset code to the provided email address
  requestPasswordReset(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/password-reset/`, data);
  }

  // Verifies the reset code and sets the new password
  confirmPasswordReset(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/password-reset/confirm/`, data);
  }

  // --- Service Request Methods ---

  // Fetches requests for the logged in user
  // Providers see requests for their services, customers see their own requests
  getRequests(): Observable<any> {
    return this.http.get(`${this.baseUrl}/requests/`, { headers: this.getHeaders() });
  }

  // Submits a new service request from a customer to a provider
  createRequest(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/requests/create/`, data, { headers: this.getHeaders() });
  }

  // Cancels a pending request (customers only)
  cancelRequest(id: number): Observable<any> {
    return this.http.patch(`${this.baseUrl}/requests/${id}/cancel/`, {}, { headers: this.getHeaders() });
  }

  // Updates the status of a request (accept, decline or complete)
  updateRequest(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/requests/${id}/`, data, { headers: this.getHeaders() });
  }
}