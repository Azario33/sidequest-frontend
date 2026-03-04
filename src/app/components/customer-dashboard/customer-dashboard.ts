// customer-dashboard.ts
// This component is the dashboard for customer accounts
// It shows all service requests the customer has submitted and their current status

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-dashboard.html',
  styleUrl: './customer-dashboard.css'
})
export class CustomerDashboardComponent implements OnInit {
  // All requests made by this customer
  requests: any[] = [];

  loading = true;
  error = false;
  currentUser: any = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();

    // Redirect non-customers away from this page
    if (!this.currentUser || this.currentUser.role !== 'customer') {
      this.router.navigate(['/services']);
      return;
    }

    this.loadRequests();
  }

  // Fetches all requests from the API and filters to only show this customer's requests
  loadRequests() {
    this.apiService.getRequests().subscribe({
      next: (data) => {
        // Extra client side filter to make sure only this customer's requests are shown
        this.requests = data.filter((r: any) => r.customer?.id === this.currentUser.id);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching requests', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  // Cancels a pending request after confirming with the user
  cancelRequest(requestId: number) {
    if (!confirm('Are you sure you want to cancel this request?')) return;

    this.apiService.cancelRequest(requestId).subscribe({
      next: (updated) => {
        // Update the request status locally so the UI reflects the change immediately
        const req = this.requests.find(r => r.id === requestId);
        if (req) req.status = updated.status;
      },
      error: (err) => {
        console.error('Error cancelling request', err);
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

  getDeclinedCount(): number {
    return this.requests.filter(r => r.status === 'declined').length;
  }

  getCompletedCount(): number {
    return this.requests.filter(r => r.status === 'completed').length;
  }
}