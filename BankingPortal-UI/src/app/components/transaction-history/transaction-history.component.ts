// transaction-history.component.ts

import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { TransactionComponent } from '../transaction/transaction.component';
import { EMPTY, catchError, tap } from 'rxjs';

@Component({
  selector: 'app-transaction-history',
  templateUrl: './transaction-history.component.html',
  styleUrls: ['./transaction-history.component.css'],
})
export class TransactionHistoryComponent implements OnInit {
  transactionHistory: any[] = [];
  userAccountNumber: string | null = null;
  filteredTransactionHistory: any[] = [];
  filterCriteria: string = ''; // Holds the filter criteria selected by the user

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadTransactionHistory();
    console.log(this.transactionHistory);
  }

  loadTransactionHistory(): void {
    this.userAccountNumber = TransactionComponent.getAccountNumberFromToken(); // Get user's account number from the token

    this.apiService
      .getTransactions()
      .pipe(
        tap((data) => {
          // Normalize incoming data: make sure transactionDate is a valid Date object
          this.transactionHistory = (data || []).map((tx: any) => {
            const raw =
              tx.transactionDate ??
              tx.timestamp ??
              tx.createdAt ??
              tx.date ??
              tx.transaction_date ??
              tx.time;
            const parsedDate = this.parseDate(raw);
            return {
              ...tx,
              transactionDate: parsedDate,
            };
          });

          this.filterTransactions(); // Apply initial filtering based on the current filter criteria
          console.log(this.transactionHistory); // Now the data will be logged in the console
        }),
        catchError((error) => {
          console.error('Error fetching transaction history:', error);
          return EMPTY; // Return an empty observable to complete the observable chain
        })
      )
      .subscribe();
  }

  // Normalize various possible timestamp formats coming from backend
  parseDate(timestamp: any): Date {
    if (!timestamp) return new Date();

    if (timestamp instanceof Date) return timestamp;

    if (typeof timestamp === 'number') {
      return timestamp < 10000000000
        ? new Date(timestamp * 1000)
        : new Date(timestamp);
    }

    if (typeof timestamp === 'string') {
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) return d;

      // Try parsing common SQL datetime format by replacing space with T
      const replaced = timestamp.replace(' ', 'T');
      const d2 = new Date(replaced);
      if (!isNaN(d2.getTime())) return d2;
    }

    if (Array.isArray(timestamp)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = timestamp;
      return new Date(year, month - 1, day, hour, minute, second);
    }

    console.warn('Unable to parse timestamp in transaction-history:', timestamp);
    return new Date();
  }

  getTransactionStatus(transaction: any): string {
    // Return proper transaction type based on transactionType field
    const type = transaction.transactionType;

    switch (type) {
      case 'CASH_DEPOSIT':
        return 'Nạp tiền';
      case 'CASH_WITHDRAWAL':
        return 'Rút tiền';
      case 'CASH_TRANSFER':
        // Check if user is sender or receiver
        if (transaction.sourceAccountNumber === this.userAccountNumber) {
          return 'Chuyển tiền';
        } else {
          return 'Nhận tiền';
        }
      default:
        return 'Giao dịch';
    }
  }

  filterTransactions(): void {
    // Reset the filteredTransactionHistory array
    this.filteredTransactionHistory = this.transactionHistory.slice();

    if (this.filterCriteria === 'Deposit') {
      // Filter transactions for deposits
      this.filteredTransactionHistory = this.filteredTransactionHistory.filter(
        (transaction) => transaction.transactionType === 'CASH_DEPOSIT'
      );
    } else if (this.filterCriteria === 'Withdrawal') {
      // Filter transactions for withdrawals
      this.filteredTransactionHistory = this.filteredTransactionHistory.filter(
        (transaction) => transaction.transactionType === 'CASH_WITHDRAWAL'
      );
    } else if (this.filterCriteria === 'Transfer') {
      // Filter transactions for fund transfers
      this.filteredTransactionHistory = this.filteredTransactionHistory.filter(
        (transaction) => transaction.transactionType === 'CASH_TRANSFER'
      );
    }
  }

  // Function to handle filter criteria changes
  onFilterCriteriaChange(event: any): void {
    this.filterCriteria = event.target.value;
    this.filterTransactions(); // Apply filtering based on the selected filter criteria
  }
}
