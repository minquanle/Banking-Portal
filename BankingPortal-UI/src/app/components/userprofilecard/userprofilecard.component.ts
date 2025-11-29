import { AuthService } from 'src/app/services/auth.service';
import { ApiService } from 'src/app/services/api.service';
import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environment/environment';

@Component({
  selector: 'app-userprofilecard',
  templateUrl: './userprofilecard.component.html',
  styleUrls: ['./userprofilecard.component.css'],
})
export class UserprofilecardComponent implements OnInit {
  userProfileData: any;
  accountDetails: any;
  isBalanceVisible: boolean = true;
  displayBalance: string = '0 ₫';
  isLoading: boolean = true;

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    // Load state immediately without blocking
    this.loadBalanceVisibilityState();

    // Defer API calls to not block initial render
    setTimeout(() => {
      this.loadUserData();
    }, 0);
  }

  private loadUserData(): void {
    // Load both APIs in parallel for faster loading
    Promise.all([
      this.getUserProfileData(),
      this.getAccountDetails()
    ]).finally(() => {
      this.isLoading = false;
    });
  }

  getUserProfileData(): Promise<void> {
    return new Promise((resolve) => {
      this.authService.getUserDetails().subscribe({
        next: (data: any) => {
          console.log('[UserProfile] User data loaded:', data);
          this.userProfileData = data;
          resolve();
        },
        error: (error: any) => {
          console.error('Error fetching user profile data:', error);
          resolve(); // Resolve anyway to not block
        },
      });
    });
  }

  getAccountDetails(): Promise<void> {
    return new Promise((resolve) => {
      this.apiService.getAccountDetails().subscribe({
        next: (data: any) => {
          console.log('[UserProfile] Account details loaded:', data);
          console.log('[UserProfile] Balance from account:', data?.balance);
          this.accountDetails = data;
          this.updateDisplayBalance();
          resolve();
        },
        error: (error: any) => {
          console.error('Error fetching account details:', error);
          resolve(); // Resolve anyway to not block
        },
      });
    });
  }

  loadBalanceVisibilityState(): void {
    const accountNumber = this.getUserAccountNumber();
    console.log('[UserProfile] Loading balance visibility for account:', accountNumber);
    if (accountNumber) {
      const storageKey = `balanceVisible_${accountNumber}`;
      const stored = localStorage.getItem(storageKey);
      console.log('[UserProfile] Stored visibility state:', stored);
      if (stored !== null) {
        this.isBalanceVisible = stored === 'true';
      } else {
        // Default to visible for new accounts
        this.isBalanceVisible = true;
      }
      console.log('[UserProfile] isBalanceVisible set to:', this.isBalanceVisible);
    }
  }

  saveBalanceVisibilityState(): void {
    const accountNumber = this.getUserAccountNumber();
    if (accountNumber) {
      const storageKey = `balanceVisible_${accountNumber}`;
      localStorage.setItem(storageKey, this.isBalanceVisible.toString());
      console.log('[UserProfile] Saved visibility state:', this.isBalanceVisible, 'for account:', accountNumber);
    }
  }

  getUserAccountNumber(): string {
    const token = localStorage.getItem(environment.tokenName);
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

  toggleBalanceVisibility(): void {
    this.isBalanceVisible = !this.isBalanceVisible;
    this.saveBalanceVisibilityState();
    this.updateDisplayBalance();
    console.log('[UserProfile] Balance visibility toggled:', this.isBalanceVisible);
    console.log('[UserProfile] Display balance:', this.displayBalance);
  }

  private updateDisplayBalance(): void {
    const balance = this.accountDetails?.balance;
    console.log('[UserProfile] Updating display - isVisible:', this.isBalanceVisible,
                'balance:', balance);

    if (!this.isBalanceVisible) {
      this.displayBalance = '••••••••';
      return;
    }

    if (!this.accountDetails || balance === undefined || balance === null) {
      this.displayBalance = '0 ₫';
      return;
    }

    this.displayBalance = this.formatBalance(balance);
  }

  private formatBalance(balance: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(balance);
  }
}
