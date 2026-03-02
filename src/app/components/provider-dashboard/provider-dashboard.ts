import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-provider-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './provider-dashboard.html',
  styleUrl: './provider-dashboard.css'
})
export class ProviderDashboardComponent implements OnInit {
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
    if (!this.currentUser || this.currentUser.role !== 'provider') {
      this.router.navigate(['/services']);
      return;
    }
    this.loadRequests();
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