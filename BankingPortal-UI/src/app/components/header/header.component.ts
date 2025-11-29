import { ToastService } from 'angular-toastify';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environment/environment';

import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  private authTokenName = environment.tokenName;

  constructor(
    private authService: AuthService,
    private router: Router,
    private _toastService: ToastService
  ) {}

  isLoggedIn() {
    return this.authService.isLoggedIn();
  }

  checkScreenSize() {
    return window.innerWidth < 768;
  }

  logout(): void {
    // Get account number before clearing token
    const accountNumber = this.getUserAccountNumber();

    this.authService.logOutUser().subscribe({
      next: () => {
        // Clear all account-specific data from localStorage
        this.clearAccountData(accountNumber);

        // Clear auth token
        localStorage.removeItem(this.authTokenName);

        this.router.navigate(['/']);
      },
      error: (error: any) => {
        console.error('Logout error:', error);

        // Still clear data even if logout API fails
        this.clearAccountData(accountNumber);
        localStorage.removeItem(this.authTokenName);

        this._toastService.error(error.error);
        this.router.navigate(['/']);
      },
    });
  }

  private getUserAccountNumber(): string {
    const token = localStorage.getItem(this.authTokenName);
    if (!token) {
      return '';
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return '';
      }
      const payload = JSON.parse(atob(parts[1]));
      return payload.sub || '';
    } catch (e) {
      console.error('Error decoding token:', e);
      return '';
    }
  }

  private clearAccountData(accountNumber: string): void {
    if (!accountNumber) return;

    // Clear spending limits data
    localStorage.removeItem(`spendingLimits_${accountNumber}`);

    // Clear current spending data
    localStorage.removeItem(`currentSpending_${accountNumber}`);

    // Clear limit alerts data
    localStorage.removeItem(`limitAlerts_${accountNumber}`);

    // Clear balance visibility state
    localStorage.removeItem(`balanceVisible_${accountNumber}`);

    console.log(`Cleared all data for account: ${accountNumber}`);
  }
}
