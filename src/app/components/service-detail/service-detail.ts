// service-detail.ts
// This component shows the full details of a single service
// It also handles the request form, pre-filling from a previous request
// And shows an approximate map location of the provider for customer context
// The exact provider address is never revealed — only an offset pin is shown

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GoogleMapsModule } from '@angular/google-maps';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';
import { LocationService } from '../../services/location';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, GoogleMapsModule],
  templateUrl: './service-detail.html',
  styleUrl: './service-detail.css'
})
export class ServiceDetailComponent implements OnInit {
  // The full service data loaded from the backend
  service: any = null;

  loading = true;
  error = false;
  requestSent = false;
  requestLoading = false;
  isLoggedIn = false;

  // Whether the logged in user is a provider — providers cannot request services
  isProvider = false;

  // Whether this provider owns this specific service listing
  isOwnService = false;

  requestMessage = '';
  errorMessage = '';

  // Stores the customer's previous request for this service if one exists
  // Used to pre-fill the message when re-requesting after a decline or completion
  previousRequest: any = null;

  // Distance label from the customer to this provider e.g. "3.2 km away"
  distanceLabel: string | null = null;

  // Whether the map section should be shown — only if provider has coordinates
  showMap = false;

  // Approximate pin position offset from real coordinates for privacy
  approximatePosition: google.maps.LatLngLiteral | null = null;

  // Map center and zoom for the provider location preview
  mapCenter: google.maps.LatLngLiteral = { lat: 44.6488, lng: -63.5752 };
  mapZoom = 13;

  // Map options — read-only display, no interaction needed
  mapOptions: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    zoomControl: true,
    streetViewControl: false,
    fullscreenControl: false,
    clickableIcons: false,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private locationService: LocationService
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();
    const currentUser = this.authService.getCurrentUser();

    // Check if the logged in user is a provider so we can hide the request form
    if (currentUser?.role === 'provider') {
      this.isProvider = true;
    }

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      // Load the full service details
      this.apiService.getService(+id).subscribe({
        next: (data) => {
          this.service = data;
          this.loading = false;

          // Check if this provider owns this listing so we can show the right message
          if (this.isProvider && currentUser?.username === data.provider?.user?.username) {
            this.isOwnService = true;
          }

          // Set up the approximate map location if the provider has coordinates
          if (data.provider?.latitude && data.provider?.longitude) {
            const lat = parseFloat(data.provider.latitude);
            const lng = parseFloat(data.provider.longitude);

            // Get a privacy-safe offset position from the LocationService
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

          // If the user is a customer, check for a previous request so we can pre-fill the message
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

  // Fetches the customer's previous requests and looks for one matching this service
  // If found and it was declined or completed, pre-fill the message textarea
  loadPreviousRequest(serviceId: number) {
    this.apiService.getRequests().subscribe({
      next: (requests: any[]) => {
        // Look for a previous request for this specific service that is no longer active
        const prev = requests.find(
          (r: any) => r.service?.id === serviceId &&
          (r.status === 'declined' || r.status === 'completed')
        );

        if (prev) {
          this.previousRequest = prev;
          // Pre-fill with the customer's last message to save them re-typing it
          this.requestMessage = prev.message || '';
        }
      },
      error: () => {
        // Silently fail — pre-filling is a nice-to-have feature, not critical
        console.error('Could not load previous requests');
      }
    });
  }

  // Submits a service request from the customer to the provider
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