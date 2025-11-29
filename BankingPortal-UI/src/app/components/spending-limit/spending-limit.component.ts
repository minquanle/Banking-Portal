import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { ToastService } from 'angular-toastify';
import { NotificationService } from 'src/app/services/notification.service';
import { environment } from 'src/environment/environment';

interface SpendingLimit {
  period: 'weekly' | 'monthly' | 'yearly';
  amount: number;
}

@Component({
  selector: 'app-spending-limit',
  templateUrl: './spending-limit.component.html',
  styleUrls: ['./spending-limit.component.css']
})
export class SpendingLimitComponent implements OnInit {
  // Math object for template
  Math = Math;

  // Spending limits
  weeklyLimit: number = 0;
  monthlyLimit: number = 0;
  yearlyLimit: number = 0;

  // Current spending
  weeklySpending: number = 0;
  monthlySpending: number = 0;
  yearlySpending: number = 0;

  // Percentages
  weeklyPercentage: number = 0;
  monthlyPercentage: number = 0;
  yearlyPercentage: number = 0;

  // Track if limit exceeded alerts have been shown
  limitExceededAlerts = {
    weekly: false,
    monthly: false,
    yearly: false
  };

  // UI states
  isEditMode: boolean = false;
  tempWeeklyLimit: number = 0;
  tempMonthlyLimit: number = 0;
  tempYearlyLimit: number = 0;

  constructor(
    private apiService: ApiService,
    private toastService: ToastService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadSpendingLimits();
    this.loadLimitAlertStatus();
    this.calculateCurrentSpending();

    // Subscribe to notification refresh to recalculate spending
    this.notificationService.shouldRefresh$.subscribe(shouldRefresh => {
      if (shouldRefresh) {
        this.calculateCurrentSpending();
      }
    });
  }

  loadSpendingLimits(): void {
    // Load from localStorage with account-specific key
    const accountNumber = this.getUserAccountNumber();
    if (!accountNumber) {
      console.warn('No account number found');
      return;
    }

    const storageKey = `spendingLimits_${accountNumber}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const limits = JSON.parse(stored);
      this.weeklyLimit = limits.weekly || 0;
      this.monthlyLimit = limits.monthly || 0;
      this.yearlyLimit = limits.yearly || 0;
    } else {
      // Reset to default if no data for this account
      this.weeklyLimit = 0;
      this.monthlyLimit = 0;
      this.yearlyLimit = 0;
    }
  }

  saveSpendingLimits(): void {
    const accountNumber = this.getUserAccountNumber();
    if (!accountNumber) {
      this.toastService.error('Vui lòng đăng nhập lại');
      return;
    }

    const limits = {
      weekly: this.weeklyLimit,
      monthly: this.monthlyLimit,
      yearly: this.yearlyLimit
    };
    const storageKey = `spendingLimits_${accountNumber}`;
    localStorage.setItem(storageKey, JSON.stringify(limits));
    this.toastService.success('Đã lưu hạn mức chi tiêu');
  }

  calculateCurrentSpending(): void {
    this.apiService.getTransactions().subscribe({
      next: (transactions: any[]) => {
        const now = new Date();
        const userAccountNumber = this.getUserAccountNumber();

        // Reset spending counters
        this.weeklySpending = 0;
        this.monthlySpending = 0;
        this.yearlySpending = 0;

        transactions.forEach((tx: any) => {
          const txDate = this.parseDate(tx.transactionDate || tx.timestamp || tx.createdAt);
          const amount = Math.abs(tx.amount || 0);

          // Only count outgoing transactions (withdrawals and transfers out)
          const isOutgoing =
            tx.transactionType === 'CASH_WITHDRAWAL' ||
            (tx.transactionType === 'CASH_TRANSFER' && tx.sourceAccountNumber === userAccountNumber);

          if (!isOutgoing) return;

          // Calculate for weekly
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (txDate >= weekAgo) {
            this.weeklySpending += amount;
          }

          // Calculate for monthly
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          if (txDate >= monthAgo) {
            this.monthlySpending += amount;
          }

          // Calculate for yearly
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          if (txDate >= yearAgo) {
            this.yearlySpending += amount;
          }
        });

        // Calculate percentages
        this.weeklyPercentage = this.weeklyLimit > 0 ? (this.weeklySpending / this.weeklyLimit) * 100 : 0;
        this.monthlyPercentage = this.monthlyLimit > 0 ? (this.monthlySpending / this.monthlyLimit) * 100 : 0;
        this.yearlyPercentage = this.yearlyLimit > 0 ? (this.yearlySpending / this.yearlyLimit) * 100 : 0;

        // Save current spending to localStorage for other components to use
        const accountNumber = this.getUserAccountNumber();
        if (accountNumber) {
          const storageKey = `currentSpending_${accountNumber}`;
          localStorage.setItem(storageKey, JSON.stringify({
            weekly: this.weeklySpending,
            monthly: this.monthlySpending,
            yearly: this.yearlySpending
          }));
        }

        // Check and notify if over limit
        this.checkLimits();
      },
      error: (error: any) => {
        console.error('Error calculating spending:', error);
      }
    });
  }

  checkLimits(): void {
    const userAccountNumber = this.getUserAccountNumber();
    if (!userAccountNumber) return;

    // Check weekly limit - but only warn in the UI, don't show toast
    if (this.weeklyLimit > 0 && this.weeklySpending > this.weeklyLimit) {
      this.limitExceededAlerts.weekly = true;
    } else {
      this.limitExceededAlerts.weekly = false;
    }

    // Check monthly limit
    if (this.monthlyLimit > 0 && this.monthlySpending > this.monthlyLimit) {
      this.limitExceededAlerts.monthly = true;
    } else {
      this.limitExceededAlerts.monthly = false;
    }

    // Check yearly limit
    if (this.yearlyLimit > 0 && this.yearlySpending > this.yearlyLimit) {
      this.limitExceededAlerts.yearly = true;
    } else {
      this.limitExceededAlerts.yearly = false;
    }

    this.saveLimitAlertStatus(userAccountNumber);
  }

  saveLimitAlertStatus(accountNumber: string): void {
    const storageKey = `limitAlerts_${accountNumber}`;
    localStorage.setItem(storageKey, JSON.stringify(this.limitExceededAlerts));
  }

  loadLimitAlertStatus(): void {
    const accountNumber = this.getUserAccountNumber();
    if (!accountNumber) return;

    const storageKey = `limitAlerts_${accountNumber}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      this.limitExceededAlerts = JSON.parse(stored);
    }
  }

  getUserAccountNumber(): string {
    const token = localStorage.getItem(environment.tokenName);
    if (!token) {
      console.warn('Token not found in localStorage');
      return '';
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Invalid token format');
        return '';
      }
      const payload = JSON.parse(atob(parts[1]));
      const accountNumber = payload.sub || '';
      if (!accountNumber) {
        console.warn('No account number (sub) found in token payload');
      }
      return accountNumber;
    } catch (e) {
      console.error('Error decoding token:', e);
      return '';
    }
  }

  parseDate(timestamp: any): Date {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;

    if (typeof timestamp === 'number') {
      return timestamp < 10000000000 ? new Date(timestamp * 1000) : new Date(timestamp);
    }

    if (typeof timestamp === 'string') {
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) return d;

      const replaced = timestamp.replace(' ', 'T');
      const d2 = new Date(replaced);
      if (!isNaN(d2.getTime())) return d2;
    }

    if (Array.isArray(timestamp)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = timestamp;
      return new Date(year, month - 1, day, hour, minute, second);
    }

    return new Date();
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  getProgressColor(percentage: number): string {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  enableEditMode(): void {
    this.isEditMode = true;
    this.tempWeeklyLimit = this.weeklyLimit;
    this.tempMonthlyLimit = this.monthlyLimit;
    this.tempYearlyLimit = this.yearlyLimit;
  }

  cancelEdit(): void {
    this.isEditMode = false;
  }

  saveEdit(): void {
    this.weeklyLimit = this.tempWeeklyLimit;
    this.monthlyLimit = this.tempMonthlyLimit;
    this.yearlyLimit = this.tempYearlyLimit;

    this.saveSpendingLimits();
    this.calculateCurrentSpending();
    this.isEditMode = false;
  }

  formatInputAmount(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value);
  }
}
