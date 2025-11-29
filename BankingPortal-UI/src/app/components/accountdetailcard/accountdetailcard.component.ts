import { ToastService } from 'angular-toastify';
import { ApiService } from 'src/app/services/api.service';
import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environment/environment';

@Component({
  selector: 'app-accountdetailcard',
  templateUrl: './accountdetailcard.component.html',
  styleUrls: ['./accountdetailcard.component.css'],
})
export class AccountdetailcardComponent implements OnInit {
  accountDetails: any;
  isBalanceVisible: boolean = true;

  constructor(
    private apiService: ApiService,
    private _toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.getAccountDetails();
    this.loadBalanceVisibilityState();
  }

  getAccountDetails(): void {
    this.apiService.getAccountDetails().subscribe({
      next: (data: any) => {
        this.accountDetails = data;
        // Load visibility state after account details are loaded
        this.loadBalanceVisibilityState();
      },
      error: (error: any) => {
        this._toastService.error('Error fetching account details');
        console.log('Error fetching account details:', error);
      },
    });
  }

  loadBalanceVisibilityState(): void {
    const accountNumber = this.getUserAccountNumber();
    console.log('Loading balance visibility for account:', accountNumber);
    if (accountNumber) {
      const storageKey = `balanceVisible_${accountNumber}`;
      const stored = localStorage.getItem(storageKey);
      console.log('Stored visibility state:', stored);
      if (stored !== null) {
        this.isBalanceVisible = stored === 'true';
      } else {
        // Default to visible for new accounts
        this.isBalanceVisible = true;
      }
      console.log('isBalanceVisible set to:', this.isBalanceVisible);
    }
  }

  saveBalanceVisibilityState(): void {
    const accountNumber = this.getUserAccountNumber();
    if (accountNumber) {
      const storageKey = `balanceVisible_${accountNumber}`;
      localStorage.setItem(storageKey, this.isBalanceVisible.toString());
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
    console.log('Balance visibility toggled:', this.isBalanceVisible);
    this.saveBalanceVisibilityState();
  }

  getDisplayBalance(): string {
    console.log('getDisplayBalance called - isBalanceVisible:', this.isBalanceVisible,
                'balance:', this.accountDetails?.balance);

    if (!this.isBalanceVisible) {
      return '••••••••';
    }

    if (!this.accountDetails || this.accountDetails.balance === undefined) {
      console.log('Account details or balance is undefined');
      return '0 ₫';
    }

    return this.formatBalance(this.accountDetails.balance);
  }

  private formatBalance(balance: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(balance || 0);
  }
}
