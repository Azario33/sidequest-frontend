// service-detail.ts
// This component shows the full details of a single service
// It also handles the request form, including pre-filling the message from a previous request

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-detail.html',
  styleUrl: './service-detail.css'
})
export class ServiceDetailComponent implements OnInit {
  service: any = null;
  loading = true;
  error = false;
  requestSent = false;
  requestLoading = false;
  isLoggedIn = false;
  isProvider = false;
  isOwnService = false;
  requestMessage = '';
  errorMessage = '';

  // Stores the customer's previous request for this service if one exists
  previousRequest: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();
    const currentUser = this.authService.getCurrentUser();

    // Check if the logged in user is a provider
    if (currentUser?.role === 'provider') {
      this.isProvider = true;
    }

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.apiService.getService(+id).subscribe({
        next: (data) => {
          this.service = data;
          this.loading = false;

          // Check if the logged in provider owns this service
          if (this.isProvider && currentUser?.username === data.provider?.user?.username) {
            this.isOwnService = true;
          }

          // If the user is a customer, check for a previous request for this service
          if (this.isLoggedIn && !this.isProvider) {
            this.loadPreviousRequest(+id);
          }
        },
        error: () => {
          this.error = true;
          this.loading = false;
        }
      });
    }
  }

  // Fetches the customer's requests and looks for a previous one for this service
  loadPreviousRequest(serviceId: number) {
    this.apiService.getRequests().subscribe({
      next: (requests: any[]) => {
        const prev = requests.find(
          (r: any) => r.service?.id === serviceId &&
          (r.status === 'declined' || r.status === 'completed')
        );

        if (prev) {
          this.previousRequest = prev;
          this.requestMessage = prev.message || '';
        }
      },
      error: () => {
        console.error('Could not load previous requests');
      }
    });
  }

  sendRequest() {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    this.requestLoading = true;
    this.errorMessage = '';

    this.apiService.createRequest({
      service: this.service.id,
      message: this.requestMessage
    }).subscribe({
      next: () => {
        this.requestSent = true;
        this.requestLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Request failed. Please try again.';
        this.requestLoading = false;
      }
    });
  }
}