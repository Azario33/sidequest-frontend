import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './services.html',
  styleUrl: './services.css'
})
export class ServicesComponent implements OnInit {
  services: any[] = [];
  loading = true;
  error = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.apiService.getServices().subscribe({
      next: (data) => {
        this.services = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching services', err);
        this.error = true;
        this.loading = false;
      }
    });
  }
}