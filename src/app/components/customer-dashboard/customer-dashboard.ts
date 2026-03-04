// customer-dashboard.ts
// This component is the dashboard for customer accounts
// It shows all service requests the customer has submitted and their current status

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-dashboard.html',
  styleUrl: './customer-dashboard.css'
})
export class CustomerDashboardComponent implements OnInit {
  // All requests made by this customer
  requests: any[] = [];

  // Sorted list shown in the template
  sortedRequests: any[] = [];

  // Currently selected sort option
  sortOption = 'newest';

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

  loadRequests() {
    this.apiService.getRequests().subscribe({
      next: (data) => {
        this.requests = data.filter((r: any) => r.customer?.id === this.currentUser.id);
        this.applySort();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching requests', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  onSortChange() {
    this.applySort();
  }

  applySort() {
    let results = [...this.requests];
    switch (this.sortOption) {
      case 'newest':
        results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        results.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'status':
        // Order: pending → accepted → completed → declined
        const order: any = { pending: 0, accepted: 1, completed: 2, declined: 3 };
        results.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
        break;
    }
    this.sortedRequests = results;
  }

  // Cancels a pending request after confirming with the user
  cancelRequest(requestId: number) {
    if (!confirm('Are you sure you want to cancel this request?')) return;

    this.apiService.cancelRequest(requestId).subscribe({
      next: (updated) => {
        const req = this.requests.find(r => r.id === requestId);
        if (req) req.status = updated.status;
        this.applySort();
      },
      error: (err) => {
        console.error('Error cancelling request', err);
      }
    });
  }

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