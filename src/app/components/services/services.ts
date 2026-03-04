// services.ts
// This component handles the main services listing page
// It fetches all services from the API and supports search, category filtering and sorting

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';

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

  // Whether the current user is logged in — used to show login nudges to guests
  isLoggedIn = false;

  loading = true;
  error = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();

    // Fetch all services when the component loads
    this.apiService.getServices().subscribe({
      next: (data) => {
        this.services = data;
        this.filteredServices = data;

        // Extract unique categories from the services for the filter buttons
        this.categories = Array.from(new Set(data.map((s: any) => s.category))) as string[];
        this.loading = false;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error fetching services', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  // Called when the search input changes
  onSearch() {
    this.applyFilters();
  }

  // Called when the sort option changes
  onSortChange() {
    this.applyFilters();
  }

  // Toggles the selected category - clicking the same category again deselects it
  selectCategory(category: string) {
    this.selectedCategory = this.selectedCategory === category ? '' : category;
    this.applyFilters();
  }

  // Applies search, category filter and sort to the full services list
  applyFilters() {
    let results = this.services;

    // Filter by selected category if one is chosen
    if (this.selectedCategory) {
      results = results.filter(s => s.category === this.selectedCategory);
    }

    // Filter by search query across title, description and category
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      results = results.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query)
      );
    }

    // Apply the selected sort option
    results = this.applySorting(results);

    this.filteredServices = results;
  }

  // Sorts the results array based on the currently selected sort option
  applySorting(results: any[]): any[] {
    switch (this.sortOption) {
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