// account-settings.ts
// This component allows both customers and providers to update their email and password
// It is accessible to any logged in user via the Settings link in the navbar

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account-settings.html',
  styleUrl: './account-settings.css'
})
export class AccountSettingsComponent implements OnInit {
  currentUser: any = null;

  // Email form state
  emailForm = { email: '' };
  emailLoading = false;
  emailError = '';
  emailSuccess = '';

  // Password form state
  passwordForm = { new_password: '', confirm_password: '' };
  passwordLoading = false;
  passwordError = '';
  passwordSuccess = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();

    // Redirect to login if not logged in
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    // Pre-fill email with the user's current email
    this.emailForm.email = this.currentUser.email || '';
  }

  // Validates and submits the email change to the backend
  updateEmail() {
    this.emailError = '';
    this.emailSuccess = '';

    if (!this.emailForm.email) {
      this.emailError = 'Please enter an email address.';
      return;
    }

    // Basic email format check before sending to the backend
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.emailForm.email)) {
      this.emailError = 'Please enter a valid email address.';
      return;
    }

    this.emailLoading = true;
    this.apiService.updateAccountSettings({ email: this.emailForm.email }).subscribe({
      next: (res) => {
        this.emailSuccess = 'Email updated successfully!';
        this.emailLoading = false;
        // Update the stored user session so the navbar reflects the new email
        this.authService.updateStoredUser(res.user);
        setTimeout(() => this.emailSuccess = '', 3000);
      },
      error: (err) => {
        this.emailError = err.error?.error || 'Failed to update email.';
        this.emailLoading = false;
      }
    });
  }

  // Validates and submits the password change to the backend
  updatePassword() {
    this.passwordError = '';
    this.passwordSuccess = '';

    if (!this.passwordForm.new_password) {
      this.passwordError = 'Please enter a new password.';
      return;
    }

    // Confirm both password fields match before sending to the backend
    if (this.passwordForm.new_password !== this.passwordForm.confirm_password) {
      this.passwordError = 'Passwords do not match.';
      return;
    }

    this.passwordLoading = true;
    this.apiService.updateAccountSettings({ new_password: this.passwordForm.new_password }).subscribe({
      next: (res) => {
        this.passwordSuccess = 'Password updated successfully!';
        this.passwordLoading = false;
        this.passwordForm = { new_password: '', confirm_password: '' };
        // Save the new JWT token so the user stays logged in after the password change
        this.authService.updateStoredToken(res.token);
        setTimeout(() => this.passwordSuccess = '', 3000);
      },
      error: (err) => {
        this.passwordError = err.error?.error || 'Failed to update password.';
        this.passwordLoading = false;
      }
    });
  }
}