import { ApiService } from 'src/app/services/api.service';

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  showPINCreationModel: boolean = false;
  isLoading: boolean = false;

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    // Check PIN status asynchronously without blocking UI
    // Use setTimeout to defer API call after initial render
    setTimeout(() => {
      this.checkPINStatus();
    }, 0);
  }

  checkPINStatus(): void {
    this.isLoading = true;
    this.apiService.checkPinCreated().subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response && response.hasPIN === false) {
          // Show the PIN creation model.
          this.showPINCreationModel = true;
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error checking PIN status:', error);
        // Don't block UI even if API fails
      },
    });
  }

  redirectToPINCreationPage(): void {
    // Hide the PIN creation model.
    this.showPINCreationModel = false;
    // Redirect the user to the PIN creation page.
    this.router.navigate(['/account/pin']);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
