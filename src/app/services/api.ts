import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Services
  getServices(): Observable<any> {
    return this.http.get(`${this.baseUrl}/services/`);
  }

  getService(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/services/${id}/`);
  }

  // Providers
  getProviders(): Observable<any> {
    return this.http.get(`${this.baseUrl}/providers/`);
  }

  getProvider(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/providers/${id}/`);
  }

  // Users
  getUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/`);
  }

  // Service Requests
  getRequests(): Observable<any> {
    return this.http.get(`${this.baseUrl}/requests/`, { headers: this.getHeaders() });
  }

  createRequest(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/requests/`, data, { headers: this.getHeaders() });
  }

  updateRequest(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/requests/${id}/`, data, { headers: this.getHeaders() });
  }
}