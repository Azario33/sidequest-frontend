import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-providers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './providers.html',
  styleUrl: './providers.css'
})
export class ProvidersComponent implements OnInit {
  providers: any[] = [];
  loading = true;
  error = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.apiService.getProviders().subscribe({
      next: (data) => {
        this.providers = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching providers', err);
        this.error = true;
        this.loading = false;
      }
    });
  }
}