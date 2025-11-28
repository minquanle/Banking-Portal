import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$: Observable<number> = this.unreadCountSubject.asObservable();

  private shouldRefreshSubject = new BehaviorSubject<boolean>(false);
  public shouldRefresh$: Observable<boolean> = this.shouldRefreshSubject.asObservable();

  constructor() {
    // Load unread count from localStorage on init
    const stored = localStorage.getItem('unreadNotificationCount');
    if (stored) {
      this.unreadCountSubject.next(parseInt(stored, 10));
    }
  }

  updateUnreadCount(count: number): void {
    this.unreadCountSubject.next(count);
    localStorage.setItem('unreadNotificationCount', count.toString());
  }

  getUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  triggerRefresh(): void {
    this.shouldRefreshSubject.next(true);
  }

  incrementUnreadCount(): void {
    const current = this.unreadCountSubject.value;
    this.updateUnreadCount(current + 1);
  }

  decrementUnreadCount(): void {
    const current = this.unreadCountSubject.value;
    if (current > 0) {
      this.updateUnreadCount(current - 1);
    }
  }

  resetUnreadCount(): void {
    this.updateUnreadCount(0);
  }
}

