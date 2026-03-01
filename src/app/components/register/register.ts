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
  error = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  validatePassword(password: string): string | null {
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
    if (!/[!@#$%^&*]/.test(password)) return 'Password must contain at least one symbol (!@#$%^&*).';
    return null;
  }

  onSubmit() {
    this.error = '';

    const passwordError = this.validatePassword(this.password);
    if (passwordError) {
      this.error = passwordError;
      return;
    }

    if (!this.username || !this.email) {
      this.error = 'Please fill in all fields.';
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
        this.error = err.error?.error || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }
}