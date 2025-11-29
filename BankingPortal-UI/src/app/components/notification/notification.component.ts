import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { ToastService } from 'angular-toastify';
import { NotificationService } from 'src/app/services/notification.service';
import { Subscription } from 'rxjs';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
  amount: number;
  relatedAccountNumber: string;
}

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount: number = 0;
  isOpen: boolean = false;
  isLoading: boolean = false;
  private refreshInterval: any;
  private readNotificationIds: Set<number> = new Set();
  private refreshSubscription?: Subscription;
  private currentAccountNumber: string = '';

  constructor(
    private apiService: ApiService,
    private toastService: ToastService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Load read notification IDs from localStorage
    const stored = localStorage.getItem('readNotificationIds');
    if (stored) {
      this.readNotificationIds = new Set(JSON.parse(stored));
    }

    // Fetch current account number first
    this.apiService.getAccountDetails().subscribe({
      next: (accountData: any) => {
        this.currentAccountNumber = accountData.accountNumber || '';
        this.loadNotifications();
      },
      error: (error: any) => {
        console.error('Error fetching account details:', error);
        this.loadNotifications(); // Load anyway
      }
    });

    // Auto-refresh every 10 seconds
    this.refreshInterval = setInterval(() => {
      this.loadNotifications();
    }, 10000);

    // Subscribe to refresh trigger from other components
    this.refreshSubscription = this.notificationService.shouldRefresh$.subscribe(shouldRefresh => {
      if (shouldRefresh) {
        this.loadNotifications();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.loadNotifications();
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.apiService.getTransactions().subscribe({
      next: (response: any) => {
        // Sort by timestamp descending and take only 10 most recent
        const sortedTransactions = (response || []).sort((a: any, b: any) => {
          const dateA = this.parseDate(this.extractTimestamp(a));
          const dateB = this.parseDate(this.extractTimestamp(b));
          return dateB.getTime() - dateA.getTime();
        }).slice(0, 10);

        // Convert transactions to notifications
        this.notifications = sortedTransactions.map((transaction: any) => {
          const notificationId = transaction.id || transaction.transactionId || transaction.txId || Math.floor(Math.random() * 1000000);
          const isRead = this.readNotificationIds.has(notificationId);

          let title = '';
          let message = '';
          let type = '';

          const ttype = (transaction.transactionType || transaction.type || '').toString().toLowerCase();

          switch (ttype) {
            case 'cash_deposit':
            case 'deposit':
              title = 'Nạp tiền thành công';
              message = `Bạn đã nạp ${this.formatAmount(transaction.amount)} vào tài khoản`;
              type = 'DEPOSIT';
              break;
            case 'cash_withdrawal':
            case 'withdrawal':
              title = 'Rút tiền thành công';
              message = `Bạn đã rút ${this.formatAmount(transaction.amount)} từ tài khoản`;
              type = 'WITHDRAWAL';
              break;
            case 'cash_transfer':
            case 'fund_transfer':
            case 'fund transfer':
            case 'transfer':
              // Check if current user is the sender or receiver
              const sourceAcc = transaction.sourceAccountNumber || '';
              const targetAcc = transaction.targetAccountNumber || '';
              const isOutgoing = sourceAcc === this.currentAccountNumber;

              if (isOutgoing) {
                title = 'Chuyển tiền thành công';
                message = `Bạn đã chuyển ${this.formatAmount(transaction.amount)} đến TK ${targetAcc}`;
                type = 'TRANSFER_OUT';
              } else {
                title = 'Nhận tiền thành công';
                message = `Bạn đã nhận ${this.formatAmount(transaction.amount)} từ TK ${sourceAcc}`;
                type = 'TRANSFER_IN';
              }
              break;
            default:
              title = 'Giao dịch mới';
              message = `Giao dịch ${this.formatAmount(transaction.amount)}`;
              type = 'OTHER';
          }

          const ts = this.extractTimestamp(transaction);
          const createdAt = this.parseDate(ts);

          return {
            id: notificationId,
            title: title,
            message: message,
            type: type,
            isRead: isRead,
            createdAt: createdAt,
            amount: transaction.amount,
            relatedAccountNumber: transaction.relatedAccountNumber || transaction.targetAccountNumber || transaction.sourceAccountNumber
          };
        });

        // Update unread count
        this.unreadCount = this.notifications.filter(n => !n.isRead).length;
        this.notificationService.updateUnreadCount(this.unreadCount);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading notifications:', error);
        this.notifications = [];
        this.unreadCount = 0;
        this.notificationService.updateUnreadCount(0);
        this.isLoading = false;
      }
    });
  }

  // Try to find the timestamp in many possible fields
  extractTimestamp(tx: any): any {
    if (!tx) return null;
    return tx.transactionDate ?? tx.timestamp ?? tx.createdAt ?? tx.date ?? tx.transaction_date ?? tx.time ?? tx.txTime ?? tx.tx_date ?? tx.created_date ?? tx.created_at ?? tx.updatedAt ?? tx.datetime ?? null;
  }

  parseDate(timestamp: any): Date {
    if (!timestamp) return new Date();

    // If timestamp already a Date
    if (timestamp instanceof Date) return timestamp;

    // If numeric string, convert
    if (typeof timestamp === 'string' && /^[0-9]+$/.test(timestamp)) {
      const num = Number(timestamp);
      return num < 10000000000 ? new Date(num * 1000) : new Date(num);
    }

    // If timestamp is a number (Unix timestamp in milliseconds or seconds)
    if (typeof timestamp === 'number') {
      return timestamp < 10000000000 ? new Date(timestamp * 1000) : new Date(timestamp);
    }

    // If timestamp is a string
    if (typeof timestamp === 'string') {
      // Try to parse ISO format or other formats
      const date = new Date(timestamp);
      // Check if date is valid
      if (!isNaN(date.getTime())) {
        return date;
      }

      // Try replacing space with T (common MySQL format)
      const replaced = timestamp.replace(' ', 'T');
      const d2 = new Date(replaced);
      if (!isNaN(d2.getTime())) return d2;

      // Try removing milliseconds or timezone variations
      const cleaned = timestamp.split('.')[0];
      const d3 = new Date(cleaned);
      if (!isNaN(d3.getTime())) return d3;
    }

    // If timestamp is an array [year, month, day, hour, minute, second]
    if (Array.isArray(timestamp)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = timestamp;
      return new Date(year, month - 1, day, hour, minute, second);
    }

    // Fallback to current date if parsing fails
    console.warn('Unable to parse timestamp in notification component:', timestamp);
    return new Date();
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  markAsRead(notification: Notification): void {
    if (!notification.isRead) {
      notification.isRead = true;
      this.readNotificationIds.add(notification.id);
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.notificationService.updateUnreadCount(this.unreadCount);

      // Save to localStorage
      localStorage.setItem('readNotificationIds', JSON.stringify(Array.from(this.readNotificationIds)));
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => {
      n.isRead = true;
      this.readNotificationIds.add(n.id);
    });
    this.unreadCount = 0;
    this.notificationService.updateUnreadCount(0);

    // Save to localStorage
    localStorage.setItem('readNotificationIds', JSON.stringify(Array.from(this.readNotificationIds)));
    this.toastService.success('Đã đánh dấu tất cả đã đọc');
  }

  deleteNotification(notification: Notification, event: Event): void {
    event.stopPropagation();

    const index = this.notifications.indexOf(notification);
    if (index > -1) {
      this.notifications.splice(index, 1);
      this.readNotificationIds.add(notification.id);

      if (!notification.isRead) {
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.notificationService.updateUnreadCount(this.unreadCount);
      }

      // Save to localStorage
      localStorage.setItem('readNotificationIds', JSON.stringify(Array.from(this.readNotificationIds)));
      this.toastService.success('Đã xóa thông báo');
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'DEPOSIT': return '💰';
      case 'WITHDRAWAL': return '🏧';
      case 'TRANSFER_OUT': return '📤';
      case 'TRANSFER_IN': return '📥';
      default: return '📌';
    }
  }

  getNotificationColor(type: string): string {
    switch (type) {
      case 'DEPOSIT':
      case 'TRANSFER_IN':
        return 'text-green-600';
      case 'WITHDRAWAL':
      case 'TRANSFER_OUT':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  }

  getTimeAgo(date: Date): string {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'Không xác định';
    }

    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

    if (diffInSeconds < 0) return 'Vừa xong'; // Future date
    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;

    // Format as date if older than 7 days
    return targetDate.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
