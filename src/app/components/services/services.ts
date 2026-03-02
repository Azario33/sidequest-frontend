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
  services: any[] = [];
  filteredServices: any[] = [];
  categories: string[] = [];
  selectedCategory = '';
  searchQuery = '';
  loading = true;
  error = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.apiService.getServices().subscribe({
      next: (data) => {
        this.services = data;
        this.filteredServices = data;
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

  onSearch() {
    this.applyFilters();
  }

  selectCategory(category: string) {
    this.selectedCategory = this.selectedCategory === category ? '' : category;
    this.applyFilters();
  }

  applyFilters() {
    let results = this.services;

    if (this.selectedCategory) {
      results = results.filter(s => s.category === this.selectedCategory);
    }

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