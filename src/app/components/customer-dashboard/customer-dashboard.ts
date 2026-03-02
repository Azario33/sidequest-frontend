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
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching requests', err);
        this.error = true;
        this.loading = false;
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