// login.ts
// This component handles user login
// Also manages the forgot password flow inline on the same page

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  // Login form fields
  username = '';
  password = '';
  errorMessage = '';
  loading = false;

  // Controls which view is shown: 'login', 'request', or 'confirm'
  // 'request' = enter email to get code
  // 'confirm' = enter code and new password
  view: 'login' | 'request' | 'confirm' = 'login';

  // Forgot password - step 1 (request code)
  resetEmail = '';
  resetRequestLoading = false;
  resetRequestError = '';
  resetRequestSuccess = '';

  // Forgot password - step 2 (confirm code + new password)
  resetCode = '';
  resetNewPassword = '';
  resetConfirmPassword = '';
  resetConfirmLoading = false;
  resetConfirmError = '';
  resetConfirmSuccess = '';

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  // Submits login credentials to the backend
  login() {
    this.loading = true;
    this.errorMessage = '';
    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.router.navigate(['/services']);
      },
      error: () => {
        this.errorMessage = 'Invalid username or password';
        this.loading = false;
      }
    });
  }

  // Sends a 6-digit reset code to the entered email address
  requestReset() {
    this.resetRequestError = '';
    this.resetRequestSuccess = '';

    if (!this.resetEmail) {
      this.resetRequestError = 'Please enter your email address.';
      return;
    }

    this.resetRequestLoading = true;
    this.apiService.requestPasswordReset({ email: this.resetEmail }).subscribe({
      next: () => {
        this.resetRequestLoading = false;
        // Move to the code confirmation step
        this.view = 'confirm';
      },
      error: () => {
        this.resetRequestError = 'Something went wrong. Please try again.';
        this.resetRequestLoading = false;
      }
    });
  }

  // Verifies the code and sets the new password
  confirmReset() {
    this.resetConfirmError = '';
    this.resetConfirmSuccess = '';

    if (!this.resetCode || !this.resetNewPassword || !this.resetConfirmPassword) {
      this.resetConfirmError = 'Please fill in all fields.';
      return;
    }

    if (this.resetNewPassword !== this.resetConfirmPassword) {
      this.resetConfirmError = 'Passwords do not match.';
      return;
    }

    this.resetConfirmLoading = true;
    this.apiService.confirmPasswordReset({
      email: this.resetEmail,
      code: this.resetCode,
      new_password: this.resetNewPassword
    }).subscribe({
      next: () => {
        this.resetConfirmSuccess = 'Password reset successfully! You can now log in.';
        this.resetConfirmLoading = false;
        // Return to login view after 2 seconds
        setTimeout(() => {
          this.view = 'login';
          this.resetEmail = '';
          this.resetCode = '';
          this.resetNewPassword = '';
          this.resetConfirmPassword = '';
        }, 2000);
      },
      error: (err) => {
        this.resetConfirmError = err.error?.error || 'Invalid or expired code. Please try again.';
        this.resetConfirmLoading = false;
      }
    });
  }
}