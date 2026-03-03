// services.ts
// This component handles the main services listing page
// It fetches all services from the API and supports search and category filtering

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

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

  // Filtered list shown to the user based on search and category
  filteredServices: any[] = [];

  // List of unique categories extracted from the services data
  categories: string[] = [];

  // Currently selected category filter (empty string means all)
  selectedCategory = '';

  // Current value of the search input
  searchQuery = '';

  loading = true;
  error = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    // Fetch all services when the component loads
    this.apiService.getServices().subscribe({
      next: (data) => {
        this.services = data;
        this.filteredServices = data;

        // Extract unique categories from the services for the filter buttons
        this.categories = Array.from(new Set(data.map((s: any) => s.category))) as string[];
        this.loading = false;
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

  // Toggles the selected category - clicking the same category again deselects it
  selectCategory(category: string) {
    this.selectedCategory = this.selectedCategory === category ? '' : category;
    this.applyFilters();
  }

  // Applies both the category filter and search query to the full services list
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

    this.filteredServices = results;
  }
}