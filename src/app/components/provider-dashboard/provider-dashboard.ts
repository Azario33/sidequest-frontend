import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-provider-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './provider-dashboard.html',
  styleUrl: './provider-dashboard.css'
})
export class ProviderDashboardComponent implements OnInit {
  requests: any[] = [];
  myServices: any[] = [];
  loading = true;
  error = false;
  currentUser: any = null;
  showAddService = false;
  serviceLoading = false;
  serviceError = '';
  serviceSuccess = '';

  newService = {
    title: '',
    description: '',
    category: '',
    price: ''
  };

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser || this.currentUser.role !== 'provider') {
      this.router.navigate(['/services']);
      return;
    }
    this.loadRequests();
    this.loadMyServices();
  }

  loadRequests() {
    this.apiService.getRequests().subscribe({
      next: (data) => {
        this.requests = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching requests', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  loadMyServices() {
    this.apiService.getServices().subscribe({
      next: (data) => {
        this.myServices = data.filter((s: any) => s.provider?.user?.username === this.currentUser.username);
      },
      error: (err) => {
        console.error('Error fetching services', err);
      }
    });
  }

  addService() {
    this.serviceError = '';
    this.serviceSuccess = '';

    if (!this.newService.title || !this.newService.description || !this.newService.category || !this.newService.price) {
      this.serviceError = 'Please fill in all fields.';
      return;
    }

    this.serviceLoading = true;
    this.apiService.createService(this.newService).subscribe({
      next: () => {
        this.serviceSuccess = 'Service added successfully!';
        this.serviceLoading = false;
        this.showAddService = false;
        this.newService = { title: '', description: '', category: '', price: '' };
        this.loadMyServices();
      },
      error: (err) => {
        this.serviceError = 'Failed to add service. Please try again.';
        this.serviceLoading = false;
      }
    });
  }

  deleteService(id: number) {
    if (!confirm('Are you sure you want to delete this service?')) return;
    this.apiService.deleteService(id).subscribe({
      next: () => {
        this.myServices = this.myServices.filter(s => s.id !== id);
      },
      error: (err) => {
        console.error('Error deleting service', err);
      }
    });
  }

  updateStatus(requestId: number, status: string) {
    this.apiService.updateRequest(requestId, { status }).subscribe({
      next: () => {
        const request = this.requests.find(r => r.id === requestId);
        if (request) request.status = status;
      },
      error: (err) => {
        console.error('Error updating request', err);
      }
    });
  }

  getPendingCount(): number {
    return this.requests.filter(r => r.status === 'pending').length;
  }

  getAcceptedCount(): number {
    return this.requests.filter(r => r.status === 'accepted').length;
  }

  getCompletedCount(): number {
    return this.requests.filter(r => r.status === 'completed').length;
  }
}