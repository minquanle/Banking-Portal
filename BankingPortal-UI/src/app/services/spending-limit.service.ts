import { Injectable } from '@angular/core';
import { environment } from 'src/environment/environment';

export interface SpendingLimitCheck {
  isExceeded: boolean;
  period: 'weekly' | 'monthly' | 'yearly' | null;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class SpendingLimitService {

  constructor() { }

  /**
   * Get spending limit data for current user
   */
  getSpendingLimits(): any {
    const accountNumber = this.getUserAccountNumber();
    if (!accountNumber) return null;

    const storageKey = `spendingLimits_${accountNumber}`;
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : { weekly: 0, monthly: 0, yearly: 0 };
  }

  /**
   * Get current spending data
   */
  getCurrentSpending(): any {
    const accountNumber = this.getUserAccountNumber();
    if (!accountNumber) return null;

    const storageKey = `currentSpending_${accountNumber}`;
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : { weekly: 0, monthly: 0, yearly: 0 };
  }

  /**
   * Save current spending data
   */
  saveCurrentSpending(spending: any): void {
    const accountNumber = this.getUserAccountNumber();
    if (!accountNumber) return;

    const storageKey = `currentSpending_${accountNumber}`;
    localStorage.setItem(storageKey, JSON.stringify(spending));
  }

  /**
   * Check if adding this amount will exceed any limit
   * Returns the first exceeded limit, or null if no limit exceeded
   */
  checkIfWillExceedLimit(newAmount: number): SpendingLimitCheck {
    const limits = this.getSpendingLimits();
    const currentSpending = this.getCurrentSpending();

    if (!limits || !currentSpending) {
      return { isExceeded: false, period: null, message: '' };
    }

    const newWeeklySpending = currentSpending.weekly + newAmount;
    const newMonthlySpending = currentSpending.monthly + newAmount;
    const newYearlySpending = currentSpending.yearly + newAmount;

    // Check weekly
    if (limits.weekly > 0 && newWeeklySpending > limits.weekly) {
      return {
        isExceeded: true,
        period: 'weekly',
        message: `Chi tiêu tuần sẽ vượt quá hạn mức ${this.formatAmount(limits.weekly)} (${this.formatAmount(currentSpending.weekly)} + ${this.formatAmount(newAmount)}). Bạn có muốn tiếp tục?`
      };
    }

    // Check monthly
    if (limits.monthly > 0 && newMonthlySpending > limits.monthly) {
      return {
        isExceeded: true,
        period: 'monthly',
        message: `Chi tiêu tháng sẽ vượt quá hạn mức ${this.formatAmount(limits.monthly)} (${this.formatAmount(currentSpending.monthly)} + ${this.formatAmount(newAmount)}). Bạn có muốn tiếp tục?`
      };
    }

    // Check yearly
    if (limits.yearly > 0 && newYearlySpending > limits.yearly) {
      return {
        isExceeded: true,
        period: 'yearly',
        message: `Chi tiêu năm sẽ vượt quá hạn mức ${this.formatAmount(limits.yearly)} (${this.formatAmount(currentSpending.yearly)} + ${this.formatAmount(newAmount)}). Bạn có muốn tiếp tục?`
      };
    }

    return { isExceeded: false, period: null, message: '' };
  }

  /**
   * Get user account number from JWT token
   */
  private getUserAccountNumber(): string {
    const token = localStorage.getItem(environment.tokenName);
    if (!token) return '';

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return '';
      const payload = JSON.parse(atob(parts[1]));
      return payload.sub || '';
    } catch (e) {
      return '';
    }
  }

  /**
   * Format amount to VND currency
   */
  private formatAmount(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }
}
