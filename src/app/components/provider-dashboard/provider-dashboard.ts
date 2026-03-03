// provider-dashboard.ts
// This component is the main dashboard for provider accounts
// It lets providers manage their services and respond to incoming requests

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
  // Incoming service requests for this provider
  requests: any[] = [];

  // Services created by this provider
  myServices: any[] = [];

  loading = true;
  error = false;
  currentUser: any = null;

  // Controls whether the add service form is visible
  showAddService = false;

  serviceLoading = false;
  serviceError = '';
  serviceSuccess = '';

  // Holds the form data for creating a new service
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

    // Redirect non-providers away from this page
    if (!this.currentUser || this.currentUser.role !== 'provider') {
      this.router.navigate(['/services']);
      return;
    }

    this.loadRequests();
    this.loadMyServices();
  }

  // Fetches all incoming requests for this provider from the API
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

  // Fetches all services and filters to only show this provider's listings
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

  // Validates and submits the new service form to the API
  addService() {
    this.serviceError = '';
    this.serviceSuccess = '';

    // Make sure all fields are filled in before submitting
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

        // Reset the form after successful submission
        this.newService = { title: '', description: '', category: '', price: '' };
        this.loadMyServices();
      },
      error: (err) => {
        this.serviceError = 'Failed to add service. Please try again.';
        this.serviceLoading = false;
      }
    });
  }

  // Deletes a service after confirming with the user
  deleteService(id: number) {
    if (!confirm('Are you sure you want to delete this service?')) return;
    this.apiService.deleteService(id).subscribe({
      next: () => {
        // Remove the deleted service from the local list without refetching
        this.myServices = this.myServices.filter(s => s.id !== id);
      },
      error: (err) => {
        console.error('Error deleting service', err);
      }
    });
  }

  // Updates the status of a request (accept, decline or complete)
  updateStatus(requestId: number, status: string) {
    this.apiService.updateRequest(requestId, { status }).subscribe({
      next: () => {
        // Update the status locally so the UI reflects the change immediately
        const request = this.requests.find(r => r.id === requestId);
        if (request) request.status = status;
      },
      error: (err) => {
        console.error('Error updating request', err);
      }
    });
  }

  // Helper methods for the stats section at the top of the dashboard
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