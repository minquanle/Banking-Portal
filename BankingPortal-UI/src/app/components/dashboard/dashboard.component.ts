import { ApiService } from 'src/app/services/api.service';
import { AuthService } from 'src/app/services/auth.service';

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
  savedBeneficiaries: any[] = [];
  recentTransfers: any[] = [];
  activeTab: string = 'saved'; // Default to 'saved' tab

  constructor(private apiService: ApiService, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Check PIN status asynchronously without blocking UI
    // Use setTimeout to defer API call after initial render
    setTimeout(() => {
      this.checkPINStatus();
      this.loadSavedBeneficiaries();
      this.loadRecentTransfers();
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

  loadSavedBeneficiaries(): void {
    this.authService.getUserDetails().subscribe({
      next: (user: any) => {
        console.log('User details retrieved:', user);
        if (user?.accountNumber) {
          console.log('Fetching saved beneficiaries for account:', user.accountNumber);
          this.apiService.getSavedBeneficiaries(user.accountNumber).subscribe({
            next: (data: any) => {
              this.savedBeneficiaries = data && data.length > 0 ? data.slice(0, 5) : [];
              console.log('Saved beneficiaries loaded successfully:', this.savedBeneficiaries);
            },
            error: (err: any) => {
              console.error('Error loading saved beneficiaries - Full error:', err);
              console.error('Status:', err.status);
              console.error('Message:', err.message);
              this.savedBeneficiaries = [];
            },
          });
        } else {
          console.warn('No account number available in user:', user);
          this.savedBeneficiaries = [];
        }
      },
      error: (err: any) => {
        console.error('Error getting user details for saved beneficiaries:', err);
        this.savedBeneficiaries = [];
      },
    });
  }

  loadRecentTransfers(): void {
    this.authService.getUserDetails().subscribe({
      next: (user: any) => {
        console.log('User details retrieved:', user);
        if (user?.accountNumber) {
          console.log('Fetching recent transfers for account:', user.accountNumber);
          this.apiService.getRecentTransfers(user.accountNumber).subscribe({
            next: (data: any) => {
              this.recentTransfers = Array.isArray(data) ? data : [];
              console.log('Recent transfers loaded successfully:', this.recentTransfers);
            },
            error: (err: any) => {
              console.error('Error loading recent transfers - Full error:', err);
              console.error('Status:', err.status);
              console.error('Message:', err.message);
              this.recentTransfers = [];
            },
          });
        } else {
          console.warn('No account number available in user:', user);
          this.recentTransfers = [];
        }
      },
      error: (err: any) => {
        console.error('Error getting user details for recent transfers:', err);
        this.recentTransfers = [];
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

  navigateToTransfer(accountNumber: string): void {
    // Navigate to fund-transfer page with pre-filled account number
    this.router.navigate(['/account/fund-transfer'], {
      queryParams: { targetAccount: accountNumber }
    });
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'template') {
      // Load templates if needed
      this.loadTemplates();
    }
  }

  loadTemplates(): void {
    // Implement template loading logic here
    console.log('Loading templates for the template tab...');
  }
}
