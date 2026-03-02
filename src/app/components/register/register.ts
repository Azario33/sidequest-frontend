import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  role = 'customer';
  errorMessage = '';
  loading = false;

  checks = {
    length: false,
    uppercase: false,
    number: false,
    symbol: false
  };

  constructor(private authService: AuthService, private router: Router) {}

  validatePassword() {
    this.checks.length = this.password.length >= 8;
    this.checks.uppercase = /[A-Z]/.test(this.password);
    this.checks.number = /[0-9]/.test(this.password);
    this.checks.symbol = /[!@#$%^&*]/.test(this.password);
  }

  register() {
    this.errorMessage = '';

    if (!this.username || !this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    if (!this.checks.length || !this.checks.uppercase || !this.checks.number || !this.checks.symbol) {
      this.errorMessage = 'Please make sure your password meets all requirements.';
      return;
    }

    this.loading = true;
    this.authService.register({
      username: this.username,
      email: this.email,
      password: this.password,
      role: this.role
    }).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }
}