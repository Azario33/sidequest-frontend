// services.ts
// This component handles the main services listing page
// It fetches all services from the API and supports search, category filtering, sort
// and distance-based filtering using the customer's location

import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';
import { LocationService } from '../../services/location';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './services.html',
  styleUrl: './services.css'
})
export class ServicesComponent implements OnInit {
  // Full list of services fetched from the API
  services: any[] = [];

  // Filtered and sorted list shown to the user
  filteredServices: any[] = [];

  // List of unique categories extracted from the services data
  categories: string[] = [];

  // Currently selected category filter (empty string means all)
  selectedCategory = '';

  // Current value of the search input
  searchQuery = '';

  // Currently selected sort option
  sortOption = 'newest';

  // Currently selected distance filter in km (0 means no filter applied)
  distanceFilter = 0;

  // Whether the current user is logged in — used to show login nudges to guests
  isLoggedIn = false;

  // The customer's current coordinates stored in session — null if not yet set
  customerLocation: { lat: number, lng: number } | null = null;

  // Controls visibility of the location prompt banner at the top of the page
  showLocationBanner = true;

  // Whether we are waiting for the browser to return geolocation data
  locationLoading = false;

  // Success message shown after location is set
  locationSuccess = '';

  // Error message shown if geolocation fails or is denied
  locationError = '';

  loading = true;
  error = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private locationService: LocationService,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();

    // Check if the customer already set their location earlier this session
    this.customerLocation = this.locationService.getCustomerLocation();

    // If location is already set hide the banner
    if (this.customerLocation) {
      this.showLocationBanner = false;
    }

    // Subscribe to location changes so distance badges update automatically
    this.locationService.customerLocation$.subscribe((loc: { lat: number, lng: number } | null) => {
      this.customerLocation = loc;
      // Re-apply filters whenever location changes so distance filter updates immediately
      this.applyFilters();
    });

    // Fetch all services when the component loads
    this.apiService.getServices().subscribe({
      next: (data) => {
        this.services = data;

        // Extract unique categories from the services for the filter buttons
        this.categories = Array.from(new Set(data.map((s: any) => s.category))) as string[];
        this.loading = false;

        // Apply filters immediately after data loads so services show without needing user interaction
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error fetching services', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  // Asks the browser for the customer's current GPS coordinates
  // Coordinates are stored in memory only — never sent to the backend
  useMyLocation() {
    if (!navigator.geolocation) {
      this.locationError = 'Geolocation is not supported by your browser.';
      return;
    }

    this.locationLoading = true;
    this.locationError = '';
    this.locationSuccess = '';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.ngZone.run(() => {
          this.locationService.setCustomerLocation(
            position.coords.latitude,
            position.coords.longitude
          );
          this.locationLoading = false;
          this.showLocationBanner = false;
          this.locationSuccess = '📍 Location set! Showing distances from your current location.';
          // Auto-switch sort to nearest first when location is set
          this.sortOption = 'nearest';
          this.applyFilters();
          setTimeout(() => this.locationSuccess = '', 4000);
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

  // Clears the stored customer location and resets the distance filter
  clearLocation() {
    this.locationService.clearCustomerLocation();
    this.distanceFilter = 0;
    this.sortOption = 'newest';
    this.showLocationBanner = true;
    this.locationSuccess = '';
  }

  // Calculates the distance in km from the customer to a service's provider
  // Returns null if either the customer or the provider has no valid coordinates
  getDistance(service: any): number | null {
    if (!this.customerLocation) return null;

    // Safely parse coordinates — treat missing or invalid values as null
    const lat = service.provider?.latitude ? parseFloat(service.provider.latitude) : null;
    const lng = service.provider?.longitude ? parseFloat(service.provider.longitude) : null;

    // Return null if coordinates are missing or not valid numbers
    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return null;

    return this.locationService.calculateDistance(
      this.customerLocation.lat, this.customerLocation.lng, lat, lng
    );
  }

  // Returns a formatted distance string for display on service cards
  // e.g. "2.3 km away" or "400 m away"
  getDistanceLabel(service: any): string | null {
    const dist = this.getDistance(service);
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

  // Toggles the selected category — clicking the same category again deselects it
  selectCategory(category: string) {
    this.selectedCategory = this.selectedCategory === category ? '' : category;
    this.applyFilters();
  }

  // Applies all active filters (search, category, distance) then sorts the results
  applyFilters() {
    let results = this.services;

    // Filter by selected category if one is chosen
    if (this.selectedCategory) {
      results = results.filter(s => s.category === this.selectedCategory);
    }

    // Filter by search query across title, description and category fields
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      results = results.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query)
      );
    }

    // Filter by distance only if the customer has set their location and a filter is selected
    if (this.customerLocation && this.distanceFilter > 0) {
      results = results.filter(s => {
        const dist = this.getDistance(s);
        // If the provider has no coordinates we EXCLUDE them from distance-filtered results
        // This prevents providers without a set location from always passing the filter
        if (dist === null) return false;
        return dist <= this.distanceFilter;
      });
    }

    // Apply the selected sort option last so it works on the already-filtered results
    results = this.applySort(results);

    this.filteredServices = results;
  }

  // Sorts the results array based on the currently selected sort option
  applySort(results: any[]): any[] {
    switch (this.sortOption) {
      case 'nearest':
        // Sort by distance — services with no provider coordinates go to the bottom
        return [...results].sort((a, b) => {
          const da = this.getDistance(a) ?? Infinity;
          const db = this.getDistance(b) ?? Infinity;
          return da - db;
        });
      case 'price_asc':
        return [...results].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      case 'price_desc':
        return [...results].sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      case 'oldest':
        return [...results].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'newest':
      default:
        return [...results].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }
}