// location.service.ts
// This shared service handles everything related to the customer's location
// It stores the customer's coordinates in memory (never in the database for privacy)
// and provides utility methods for calculating distances between two points

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  // BehaviorSubject that holds the customer's current coordinates
  // Components subscribe to this so they react when the location is set or cleared
  private customerLocationSubject = new BehaviorSubject<{ lat: number, lng: number } | null>(null);
  customerLocation$ = this.customerLocationSubject.asObservable();

  // Sets the customer's location in memory — this is never sent to the backend
  setCustomerLocation(lat: number, lng: number) {
    this.customerLocationSubject.next({ lat, lng });
  }

  // Returns the current customer location snapshot (null if not set)
  getCustomerLocation(): { lat: number, lng: number } | null {
    return this.customerLocationSubject.getValue();
  }

  // Clears the stored customer location
  clearCustomerLocation() {
    this.customerLocationSubject.next(null);
  }

  // Calculates the straight-line distance in kilometres between two coordinates
  // Uses the Haversine formula which accounts for the curvature of the Earth
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometres
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Formats a raw distance number into a clean human-readable string
  // e.g. 0.4 → "400 m away", 2.7 → "2.7 km away"
  formatDistance(km: number): string {
    if (km < 1) {
      return `${Math.round(km * 1000)} m away`;
    }
    return `${km.toFixed(1)} km away`;
  }

  // Returns a slightly offset version of coordinates for privacy
  // This is used when showing provider location on maps for customers
  // The exact pin location is hidden — only the approximate area is shown
  getApproximateLocation(lat: number, lng: number): { lat: number, lng: number } {
    // Offset by up to ~400m in a random direction using a fixed seed
    // This is consistent per session but hides the exact address
    const offsetLat = (Math.sin(lat * 1000) * 0.003);
    const offsetLng = (Math.cos(lng * 1000) * 0.003);
    return {
      lat: lat + offsetLat,
      lng: lng + offsetLng
    };
  }

  // Converts degrees to radians — used internally by the Haversine formula
  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}