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
  requestMessage = '';
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.apiService.getService(+id).subscribe({
        next: (data) => {
          this.service = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = true;
          this.loading = false;
        }
      });
    }
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