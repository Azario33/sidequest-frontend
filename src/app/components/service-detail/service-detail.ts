import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule],
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
    const currentUser = this.authService.getCurrentUser();
    this.apiService.createRequest({
      customer: currentUser.id,
      service: this.service.id,
      message: 'I would like to request this service.'
    }).subscribe({
      next: () => {
        this.requestSent = true;
        this.requestLoading = false;
      },
      error: (err) => {
        console.error('Request failed', err);
        this.requestLoading = false;
      }
    });
  }
}