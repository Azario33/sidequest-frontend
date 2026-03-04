// provider-profile.ts
// This component shows a provider's full public profile
// It displays their bio, service area, availability and all their active services

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-provider-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './provider-profile.html',
  styleUrl: './provider-profile.css'
})
export class ProviderProfileComponent implements OnInit {
  // The provider's profile data
  provider: any = null;

  // All services offered by this provider
  services: any[] = [];

  loading = true;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      // Fetch the provider's profile by ID
      this.apiService.getProvider(+id).subscribe({
        next: (data) => {
          this.provider = data;

          // After loading the profile, fetch all services and filter to this provider's
          this.apiService.getServices().subscribe({
            next: (allServices) => {
              this.services = allServices.filter(
                (s: any) => s.provider?.user?.username === data.user?.username
              );
              this.loading = false;
            },
            error: () => {
              this.loading = false;
            }
          });
        },
        error: () => {
          this.error = true;
          this.loading = false;
        }
      });
    }
  }
}