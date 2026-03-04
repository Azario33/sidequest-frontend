// providers.ts
// Shows all providers with search and sort support

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
  sortOption = 'available';
  loading = true;
  error = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.apiService.getProviders().subscribe({
      next: (data) => {
        this.providers = data;
        this.applyFilters();
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
    this.applyFilters();
  }

  onSortChange() {
    this.applyFilters();
  }

  applyFilters() {
    let results = this.providers;

    // Apply search query
    const query = this.searchQuery.toLowerCase().trim();
    if (query) {
      results = results.filter(p =>
        p.user?.username?.toLowerCase().includes(query) ||
        p.bio?.toLowerCase().includes(query) ||
        p.service_area?.toLowerCase().includes(query)
      );
    }

    // Apply sort
    switch (this.sortOption) {
      case 'available':
        // Available providers first, then unavailable
        results = [...results].sort((a, b) => (b.is_available ? 1 : 0) - (a.is_available ? 1 : 0));
        break;
      case 'az':
        results = [...results].sort((a, b) =>
          a.user?.username?.localeCompare(b.user?.username)
        );
        break;
      case 'za':
        results = [...results].sort((a, b) =>
          b.user?.username?.localeCompare(a.user?.username)
        );
        break;
    }

    this.filteredProviders = results;
  }
}