// providers.ts
// This component shows all provider profiles with search, sort and distance filtering
// Uses the shared LocationService so distance calculations stay consistent across pages

import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { LocationService } from '../../services/location';

@Component({
  selector: 'app-providers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './providers.html',
  styleUrl: './providers.css'
})
export class ProvidersComponent implements OnInit {
  // Full list of providers fetched from the API
  providers: any[] = [];

  // Filtered and sorted list shown in the template
  filteredProviders: any[] = [];

  // Current value of the search input
  searchQuery = '';

  // Currently selected sort option
  sortOption = 'available';

  // Currently selected distance filter in km (0 means no filter)
  distanceFilter = 0;

  // The customer's current coordinates — null if not set
  customerLocation: { lat: number, lng: number } | null = null;

  // Controls visibility of the location prompt banner
  showLocationBanner = true;

  // Whether we are waiting for the browser geolocation response
  locationLoading = false;

  // Error shown if geolocation fails
  locationError = '';

  loading = true;
  error = false;

  constructor(
    private apiService: ApiService,
    private locationService: LocationService,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    // Check if the customer already set their location this session
    this.customerLocation = this.locationService.getCustomerLocation();

    // If location is already set, hide the banner
    if (this.customerLocation) {
      this.showLocationBanner = false;
    }

    // Subscribe so the provider list updates if location changes
    this.locationService.customerLocation$.subscribe(loc => {
      this.customerLocation = loc;
      this.applyFilters();
    });

    this.apiService.getProviders().subscribe({
      next: (data) => {
        this.providers = data;
        this.loading = false;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error fetching providers', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  // Asks the browser for the customer's GPS coordinates
  useMyLocation() {
    if (!navigator.geolocation) {
      this.locationError = 'Geolocation is not supported by your browser.';
      return;
    }

    this.locationLoading = true;
    this.locationError = '';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.ngZone.run(() => {
          this.locationService.setCustomerLocation(
            position.coords.latitude,
            position.coords.longitude
          );
          this.locationLoading = false;
          this.showLocationBanner = false;
        });
      },
      () => {
        this.ngZone.run(() => {
          this.locationError = 'Could not get your location. Please check your browser permissions.';
          this.locationLoading = false;
        });
      }
    );
  }

  // Clears the stored location and resets the distance filter
  clearLocation() {
    this.locationService.clearCustomerLocation();
    this.distanceFilter = 0;
    this.showLocationBanner = true;
  }

  // Calculates the distance in km from the customer to a provider
  // Returns null if either the customer or provider has no coordinates
  getDistance(provider: any): number | null {
    if (!this.customerLocation) return null;
    const lat = parseFloat(provider.latitude);
    const lng = parseFloat(provider.longitude);
    if (!lat || !lng) return null;
    return this.locationService.calculateDistance(
      this.customerLocation.lat, this.customerLocation.lng, lat, lng
    );
  }

  // Returns a formatted distance string for display on provider cards
  getDistanceLabel(provider: any): string | null {
    const dist = this.getDistance(provider);
    if (dist === null) return null;
    return this.locationService.formatDistance(dist);
  }

  // Called when the search input changes
  onSearch() {
    this.applyFilters();
  }

  // Called when the sort dropdown changes
  onSortChange() {
    this.applyFilters();
  }

  // Called when the distance filter dropdown changes
  onDistanceFilterChange() {
    this.applyFilters();
  }

  // Applies search, distance filter and sort to the full providers list
  applyFilters() {
    let results = this.providers;

    // Filter by search query across username, bio and service area
    const query = this.searchQuery.toLowerCase().trim();
    if (query) {
      results = results.filter(p =>
        p.user?.username?.toLowerCase().includes(query) ||
        p.bio?.toLowerCase().includes(query) ||
        p.service_area?.toLowerCase().includes(query)
      );
    }

    // Filter by distance if the customer has set their location and a filter is selected
    if (this.customerLocation && this.distanceFilter > 0) {
      results = results.filter(p => {
        const dist = this.getDistance(p);
        // Keep providers with no coordinates — don't exclude them unfairly
        if (dist === null) return true;
        return dist <= this.distanceFilter;
      });
    }

    // Apply sort
    switch (this.sortOption) {
      case 'nearest':
        // Sort by distance — providers with no coordinates go to the bottom
        results = [...results].sort((a, b) => {
          const da = this.getDistance(a) ?? Infinity;
          const db = this.getDistance(b) ?? Infinity;
          return da - db;
        });
        break;
      case 'available':
        // Available providers appear first, unavailable ones at the bottom
        results = [...results].sort((a, b) => (b.is_available ? 1 : 0) - (a.is_available ? 1 : 0));
        break;
      case 'az':
        results = [...results].sort((a, b) => a.user?.username?.localeCompare(b.user?.username));
        break;
      case 'za':
        results = [...results].sort((a, b) => b.user?.username?.localeCompare(a.user?.username));
        break;
    }

    this.filteredProviders = results;
  }
}