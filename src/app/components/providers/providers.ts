import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-providers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './providers.html',
  styleUrl: './providers.css'
})
export class ProvidersComponent implements OnInit {
  providers: any[] = [];
  filteredProviders: any[] = [];
  searchQuery = '';
  loading = true;
  error = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.apiService.getProviders().subscribe({
      next: (data) => {
        this.providers = data;
        this.filteredProviders = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching providers', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  onSearch() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredProviders = this.providers;
      return;
    }
    this.filteredProviders = this.providers.filter(p =>
      p.user?.username?.toLowerCase().includes(query) ||
      p.bio?.toLowerCase().includes(query) ||
      p.service_area?.toLowerCase().includes(query)
    );
  }
}