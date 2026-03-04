// provider-dashboard.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-provider-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './provider-dashboard.html',
  styleUrl: './provider-dashboard.css'
})
export class ProviderDashboardComponent implements OnInit {
  requests: any[] = [];
  myServices: any[] = [];

  loading = true;
  error = false;
  currentUser: any = null;

  showAddService = false;
  serviceLoading = false;
  serviceError = '';
  serviceSuccess = '';

  newService = {
    title: '',
    description: '',
    category: '',
    price: ''
  };

  // --- Profile ---
  // Controls whether the profile edit form is expanded
  showEditProfile = false;
  profileLoading = false;
  profileError = '';
  profileSuccess = '';

  // Holds the editable profile fields, pre-filled from the loaded profile
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

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser || this.currentUser.role !== 'provider') {
      this.router.navigate(['/services']);
      return;
    }

    this.loadRequests();
    this.loadMyServices();
    this.loadProfile();
  }

  // Fetches the provider's own profile and pre-fills the form
  loadProfile() {
    this.apiService.getProviders().subscribe({
      next: (providers: any[]) => {
        const mine = providers.find(p => p.user?.username === this.currentUser.username);
        if (mine) {
          this.profileForm.bio = mine.bio || '';
          this.profileForm.service_area = mine.service_area || '';
          this.profileForm.is_available = mine.is_available ?? true;
        }
      },
      error: (err) => console.error('Error loading profile', err)
    });
  }

  // Submits updated profile data to the backend
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

  loadMyServices() {
    this.apiService.getServices().subscribe({
      next: (data) => {
        this.myServices = data.filter((s: any) => s.provider?.user?.username === this.currentUser.username);
      },
      error: (err) => console.error('Error fetching services', err)
    });
  }

  addService() {
    this.serviceError = '';
    this.serviceSuccess = '';

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
        this.newService = { title: '', description: '', category: '', price: '' };
        this.loadMyServices();
      },
      error: () => {
        this.serviceError = 'Failed to add service. Please try again.';
        this.serviceLoading = false;
      }
    });
  }

  // Opens the edit form for a service and pre-fills it with the current values
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

  // Cancels editing and hides the edit form
  cancelEditService() {
    this.editingServiceId = null;
    this.editServiceError = '';
  }

  // Submits the edited service data to the backend
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
        setTimeout(() => this.serviceSuccess = '', 3000);
      },
      error: () => {
        this.editServiceError = 'Failed to update service. Please try again.';
        this.editServiceLoading = false;
      }
    });
  }

  deleteService(id: number) {
    if (!confirm('Are you sure you want to delete this service?')) return;
    this.apiService.deleteService(id).subscribe({
      next: () => {
        this.myServices = this.myServices.filter(s => s.id !== id);
      },
      error: (err) => console.error('Error deleting service', err)
    });
  }

  updateStatus(requestId: number, status: string) {
    this.apiService.updateRequest(requestId, { status }).subscribe({
      next: () => {
        const request = this.requests.find(r => r.id === requestId);
        if (request) request.status = status;
      },
      error: (err) => console.error('Error updating request', err)
    });
  }

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