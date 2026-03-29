// provider-profile.ts
// This component shows a provider's full public profile
// It displays their bio, service area, availability and all their active services
// It also shows an approximate map location to protect provider privacy
// The exact coordinates are never shown — only a slightly offset pin is displayed

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { GoogleMapsModule } from '@angular/google-maps';
import { ApiService } from '../../services/api';
import { LocationService } from '../../services/location';

@Component({
  selector: 'app-provider-profile',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule],
  templateUrl: './provider-profile.html',
  styleUrl: './provider-profile.css'
})
export class ProviderProfileComponent implements OnInit {
  // The provider's profile data loaded from the backend
  provider: any = null;

  // All services offered by this provider sorted newest first
  services: any[] = [];

  loading = true;
  error = false;

  // Distance from the customer to this provider — null if customer location not set
  distanceLabel: string | null = null;

  // Whether the map section is visible — only shown if provider has coordinates set
  showMap = false;

  // Approximate (privacy-safe) pin position shown on the map
  // This is offset from the real coordinates so the exact address is not revealed
  approximatePosition: google.maps.LatLngLiteral | null = null;

  // Map center and zoom for the provider location preview
  mapCenter: google.maps.LatLngLiteral = { lat: 44.6488, lng: -63.5752 };
  mapZoom = 13;

  // Map options — simplified display for a read-only location preview
  mapOptions: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    zoomControl: true,
    streetViewControl: false,
    fullscreenControl: false,
    // Disable clicks on the map since this is a read-only view
    clickableIcons: false,
  };

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private locationService: LocationService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      // Fetch the provider's profile by ID
      this.apiService.getProvider(+id).subscribe({
        next: (data) => {
          this.provider = data;

          // If the provider has set their coordinates, set up the approximate map location
          if (data.latitude && data.longitude) {
            const lat = parseFloat(data.latitude);
            const lng = parseFloat(data.longitude);

            // Use the LocationService to get an offset position for privacy
            const approx = this.locationService.getApproximateLocation(lat, lng);
            this.approximatePosition = approx;
            this.mapCenter = approx;
            this.showMap = true;

            // Calculate distance from the customer if their location is known
            const customerLoc = this.locationService.getCustomerLocation();
            if (customerLoc) {
              const dist = this.locationService.calculateDistance(
                customerLoc.lat, customerLoc.lng, lat, lng
              );
              this.distanceLabel = this.locationService.formatDistance(dist);
            }
          }

          // After loading the profile, fetch all services and filter to this provider's
          // Sort newest first so the most recent listings appear at the top
          this.apiService.getServices().subscribe({
            next: (allServices) => {
              this.services = allServices
                .filter((s: any) => s.provider?.user?.username === data.user?.username)
                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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