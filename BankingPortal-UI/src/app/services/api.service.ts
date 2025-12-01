import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl; // Replace with your actual API base URL

  constructor(private http: HttpClient) { }

  // Account API Endpoints

  checkPinCreated(): Observable<any> {

    return this.http.get<any>(`${this.baseUrl}/account/pin/check`);
  }

  createPin(pin: string, password: string): Observable<any> {
    const body = {
      pin: pin,
      password: password
    };
    return this.http.post<any>(`${this.baseUrl}/account/pin/create`, body);
  }

  updatePin(password: string, newPin: string): Observable<any> {
    const body = {
      password: password,
      newPin: newPin
    };
    return this.http.post<any>(`${this.baseUrl}/account/pin/update`, body);
  }

  withdraw(amount: string, pin: string): Observable<any> {
    const body = {
      amount: amount,
      pin: pin
    };
    return this.http.post<any>(`${this.baseUrl}/account/withdraw`, body);
  }

  deposit(amount: string, pin: string): Observable<any> {
    const body = {
      amount: amount,
      pin: pin
    };
    return this.http.post<any>(`${this.baseUrl}/account/deposit`, body);
  }

  fundTransfer(amount: string, pin: string, targetAccountNumber: number): Observable<any> {
    const body = {
      amount: amount,
      pin: pin,
      targetAccountNumber: targetAccountNumber
    };
    return this.http.post<any>(`${this.baseUrl}/account/fund-transfer`, body);
  }

  getTransactions(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/account/transactions`);
  }

  getAccountDetails(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/dashboard/account`);
  }

  // Notification API Endpoints
  getNotifications(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/notifications`);
  }

  getUnreadNotifications(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/notifications/unread`);
  }

  getUnreadNotificationCount(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/notifications/unread/count`);
  }

  markNotificationAsRead(notificationId: number): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/notifications/${notificationId}/read`, {});
  }

  markAllNotificationsAsRead(): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/notifications/read-all`, {});
  }

  deleteNotification(notificationId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/notifications/${notificationId}`);
  }

  // Beneficiary API Endpoints
  saveBeneficiary(accountNumber: string, beneficiaryAccountNumber: string, nickname: string): Observable<any> {
    const body = {
      accountNumber: accountNumber,
      beneficiaryAccountNumber: beneficiaryAccountNumber,
      nickname: nickname
    };
    return this.http.post<any>(`${this.baseUrl}/account/beneficiaries/save`, body);
  }

  getSavedBeneficiaries(accountNumber: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/account/beneficiaries?accountNumber=${accountNumber}`);
  }

  getRecentTransfers(accountNumber: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/account/recent-transfers?accountNumber=${accountNumber}`);
  }

  removeBeneficiary(accountNumber: string, beneficiaryAccountNumber: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/account/beneficiaries/remove?accountNumber=${accountNumber}&beneficiaryAccountNumber=${beneficiaryAccountNumber}`);
  }
}
