// provider-dashboard.ts
// This component is the main control panel for provider accounts
// It handles profile editing, location setting via Google Maps, service management and incoming request processing

import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GoogleMapsModule } from '@angular/google-maps';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-provider-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, GoogleMapsModule],
  templateUrl: './provider-dashboard.html',
  styleUrl: './provider-dashboard.css'
})
export class ProviderDashboardComponent implements OnInit {
  // All incoming service requests for this provider
  requests: any[] = [];

  // All services created by this provider
  myServices: any[] = [];

  // Sorted version of myServices used in the template
  sortedServices: any[] = [];

  loading = true;
  error = false;
  currentUser: any = null;

  // Currently selected sort option for the services list
  serviceSortOption = 'newest';

  // --- Add Service Form ---
  // Controls whether the add service form is visible
  showAddService = false;
  serviceLoading = false;
  serviceError = '';
  serviceSuccess = '';

  // Holds the new service form data before submission
  newService = {
    title: '',
    description: '',
    category: '',
    price: ''
  };

  // --- Profile Section ---
  // Controls whether the edit profile form is expanded
  showEditProfile = false;
  profileLoading = false;
  profileError = '';
  profileSuccess = '';

  // Holds the editable profile fields pre-filled from the loaded profile
  profileForm = {
    bio: '',
    service_area: '',
    is_available: true
  };

  // --- Service Editing ---
  // Tracks which service is currently being edited (null means none)
  editingServiceId: number | null = null;

  // Holds the form data for the service currently being edited
  editServiceForm = {
    title: '',
    description: '',
    category: '',
    price: ''
  };

  editServiceLoading = false;
  editServiceError = '';
  editServiceSuccess = '';

  // --- Google Maps Location ---
  // Controls whether the map panel is expanded
  showLocationMap = false;

  // Coordinates currently saved in the database for this provider
  savedLatitude: number | null = null;
  savedLongitude: number | null = null;

  // The current pin position on the map — updated by clicking the map or searching an address
  markerPosition: google.maps.LatLngLiteral | null = null;

  // Human-readable address label resolved from the pin coordinates
  resolvedAddress = '';

  // Address search form fields — provider can type their full address to find it on the map
  addressSearch = {
    street: '',
    city: '',
    province: '',
    postal: '',
    country: 'Canada'
  };

  addressSearchLoading = false;
  addressSearchError = '';

  // Map defaults to Halifax, NS — re-centers when a saved location is loaded
  mapCenter: google.maps.LatLngLiteral = { lat: 44.6488, lng: -63.5752 };
  mapZoom = 12;

  // Google Maps display options
  mapOptions: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    zoomControl: true,
    streetViewControl: false,
    fullscreenControl: false,
    // Prevents clicking on POI labels from interfering with the pin drop
    clickableIcons: false,
  };

  locationLoading = false;
  locationSuccess = '';
  locationError = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    // NgZone is required so that Google Maps geocoder callbacks trigger Angular change detection
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();

    // Redirect non-providers away from this page
    if (!this.currentUser || this.currentUser.role !== 'provider') {
      this.router.navigate(['/services']);
      return;
    }

    this.loadRequests();
    this.loadMyServices();
    this.loadProfile();
  }

  // Fetches the provider's own profile and pre-fills the forms
  // Also loads existing coordinates so the map shows their current pin on open
  loadProfile() {
    this.apiService.getProviders().subscribe({
      next: (providers: any[]) => {
        const mine = providers.find(p => p.user?.username === this.currentUser.username);
        if (mine) {
          this.profileForm.bio = mine.bio || '';
          this.profileForm.service_area = mine.service_area || '';
          this.profileForm.is_available = mine.is_available ?? true;

          // If the provider already has coordinates saved, center the map on their existing pin
          if (mine.latitude && mine.longitude) {
            this.savedLatitude = parseFloat(mine.latitude);
            this.savedLongitude = parseFloat(mine.longitude);
            this.mapCenter = { lat: this.savedLatitude, lng: this.savedLongitude };
            this.markerPosition = { lat: this.savedLatitude, lng: this.savedLongitude };
            this.resolvedAddress = mine.service_area || '';
          }
        }
      },
      error: (err) => console.error('Error loading profile', err)
    });
  }

  // Submits updated bio, service area and availability to the backend
  updateProfile() {
    this.profileError = '';
    this.profileSuccess = '';
    this.profileLoading = true;

    this.apiService.updateProviderProfile(this.profileForm).subscribe({
      next: () => {
        this.profileSuccess = 'Profile updated successfully!';
        this.profileLoading = false;
        this.showEditProfile = false;
        setTimeout(() => this.profileSuccess = '', 3000);
      },
      error: () => {
        this.profileError = 'Failed to update profile. Please try again.';
        this.profileLoading = false;
      }
    });
  }

  // Called when the provider clicks directly on the map
  // Drops a pin at the clicked location and reverse geocodes it to get a human-readable address
  onMapClick(event: google.maps.MapMouseEvent) {
    if (!event.latLng) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    // NgZone.run() ensures Angular detects the changes made inside the Maps callback
    this.ngZone.run(() => {
      this.markerPosition = { lat, lng };
      this.locationSuccess = '';
      this.locationError = '';
      this.addressSearchError = '';

      // Reverse geocode the clicked coordinates to get a readable address label
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        this.ngZone.run(() => {
          if (status === 'OK' && results && results[0]) {
            this.resolvedAddress = results[0].formatted_address;
          } else {
            // Fall back to raw coordinates if geocoding fails
            this.resolvedAddress = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          }
        });
      });
    });
  }

  // Geocodes the typed address fields and drops a pin at the result
  // Allows providers to find their location by typing instead of clicking the map
  searchAddress() {
    const { street, city, province, postal, country } = this.addressSearch;

    // At minimum a city or street is needed to geocode
    if (!city && !street) {
      this.addressSearchError = 'Please enter at least a city or street address.';
      return;
    }

    this.addressSearchLoading = true;
    this.addressSearchError = '';

    // Combine all non-empty fields into a single address string for the geocoder
    const fullAddress = [street, city, province, postal, country]
      .filter(v => v.trim() !== '')
      .join(', ');

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: fullAddress }, (results, status) => {
      this.ngZone.run(() => {
        this.addressSearchLoading = false;

        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();

          // Drop the pin, re-center the map and zoom in on the found address
          this.markerPosition = { lat, lng };
          this.mapCenter = { lat, lng };
          this.mapZoom = 15;
          this.resolvedAddress = results[0].formatted_address;
          this.locationSuccess = '';
          this.locationError = '';
        } else {
          this.addressSearchError = 'Address not found. Try adding more details or use the map pin.';
        }
      });
    });
  }

  // Saves the current pin location to the backend
  // Uses the already-resolved address if available to avoid a redundant geocoder call
  saveLocation() {
    if (!this.markerPosition) {
      this.locationError = 'Please drop a pin on the map or search for an address first.';
      return;
    }

    this.locationLoading = true;
    this.locationSuccess = '';
    this.locationError = '';

    const { lat, lng } = this.markerPosition;

    // If we already have a resolved address from clicking or searching, use it directly
    if (this.resolvedAddress) {
      this.saveCoordinates(lat, lng, this.resolvedAddress);
    } else {
      // Otherwise geocode one more time to get the address label before saving
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        this.ngZone.run(() => {
          const label = (status === 'OK' && results && results[0])
            ? results[0].formatted_address
            : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          this.saveCoordinates(lat, lng, label);
        });
      });
    }
  }

  // Sends the final coordinates and resolved address label to the backend API
  private saveCoordinates(lat: number, lng: number, address: string) {
    this.apiService.updateProviderLocation({
      latitude: lat,
      longitude: lng,
      service_area: address
    }).subscribe({
      next: () => {
        // Update local state so the collapsed summary reflects the new location immediately
        this.savedLatitude = lat;
        this.savedLongitude = lng;
        this.profileForm.service_area = address;
        this.resolvedAddress = address;
        this.locationLoading = false;
        this.locationSuccess = `✅ Location saved: ${address}`;
        setTimeout(() => this.locationSuccess = '', 5000);
      },
      error: () => {
        this.locationError = 'Failed to save location. Please try again.';
        this.locationLoading = false;
      }
    });
  }

  // Fetches all incoming service requests for this provider from the backend
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

  // Fetches all services and filters to only show those belonging to this provider
  loadMyServices() {
    this.apiService.getServices().subscribe({
      next: (data) => {
        this.myServices = data.filter((s: any) => s.provider?.user?.username === this.currentUser.username);
        this.applyServiceSort();
      },
      error: (err) => console.error('Error fetching services', err)
    });
  }

  // Called when the sort dropdown changes
  onServiceSortChange() {
    this.applyServiceSort();
  }

  // Sorts myServices into sortedServices based on the selected sort option
  applyServiceSort() {
    let results = [...this.myServices];
    switch (this.serviceSortOption) {
      case 'price_asc':
        results.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price_desc':
        results.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'oldest':
        results.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'newest':
      default:
        results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }
    this.sortedServices = results;
  }

  // Validates and submits a new service listing to the backend
  addService() {
    this.serviceError = '';
    this.serviceSuccess = '';

    // All fields are required before submitting
    if (!this.newService.title || !this.newService.description || !this.newService.category || !this.newService.price) {
      this.serviceError = 'Please fill in all fields.';
      return;
    }

    this.serviceLoading = true;
    this.apiService.createService(this.newService).subscribe({
      next: () => {
        this.serviceSuccess = 'Service added successfully!';
        this.serviceLoading = false;
        this.showAddService = false;
        // Reset the form after successful submission
        this.newService = { title: '', description: '', category: '', price: '' };
        this.loadMyServices();
      },
      error: () => {
        this.serviceError = 'Failed to add service. Please try again.';
        this.serviceLoading = false;
      }
    });
  }

  // Opens the inline edit form for a service and pre-fills it with existing values
  startEditService(service: any) {
    this.editingServiceId = service.id;
    this.editServiceForm = {
      title: service.title,
      description: service.description,
      category: service.category,
      price: service.price
    };
    this.editServiceError = '';
    this.editServiceSuccess = '';
  }

  // Cancels the edit and hides the edit form without saving
  cancelEditService() {
    this.editingServiceId = null;
    this.editServiceError = '';
  }

  // Validates and submits the edited service data to the backend
  saveEditService(serviceId: number) {
    this.editServiceError = '';
    this.editServiceSuccess = '';

    if (!this.editServiceForm.title || !this.editServiceForm.description || !this.editServiceForm.category || !this.editServiceForm.price) {
      this.editServiceError = 'Please fill in all fields.';
      return;
    }

    this.editServiceLoading = true;
    this.apiService.updateService(serviceId, this.editServiceForm).subscribe({
      next: (updated) => {
        // Update the service in the local list so the UI reflects the change immediately
        const index = this.myServices.findIndex(s => s.id === serviceId);
        if (index !== -1) this.myServices[index] = updated;
        this.editingServiceId = null;
        this.editServiceLoading = false;
        this.serviceSuccess = 'Service updated successfully!';
        this.applyServiceSort();
        setTimeout(() => this.serviceSuccess = '', 3000);
      },
      error: () => {
        this.editServiceError = 'Failed to update service. Please try again.';
        this.editServiceLoading = false;
      }
    });
  }

  // Deletes a service after confirming with the user
  deleteService(id: number) {
    if (!confirm('Are you sure you want to delete this service?')) return;
    this.apiService.deleteService(id).subscribe({
      next: () => {
        // Remove the service from the local list immediately without a full reload
        this.myServices = this.myServices.filter(s => s.id !== id);
        this.applyServiceSort();
      },
      error: (err) => console.error('Error deleting service', err)
    });
  }

  // Updates the status of a request (accept, decline or complete)
  // Also triggers a notification to the customer via the backend
  updateStatus(requestId: number, status: string) {
    this.apiService.updateRequest(requestId, { status }).subscribe({
      next: () => {
        // Update the status in the local list so the UI updates without a full reload
        const request = this.requests.find(r => r.id === requestId);
        if (request) request.status = status;
      },
      error: (err) => console.error('Error updating request', err)
    });
  }

  // Helper methods used by the stats cards at the top of the dashboard
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