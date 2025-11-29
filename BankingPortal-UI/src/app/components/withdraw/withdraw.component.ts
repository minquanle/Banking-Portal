import { ToastService } from 'angular-toastify';
import { ApiService } from 'src/app/services/api.service';
import { LoadermodelService } from 'src/app/services/loadermodel.service';
import { NotificationService } from 'src/app/services/notification.service';
import { SpendingLimitService } from 'src/app/services/spending-limit.service';

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-withdraw',
  templateUrl: './withdraw.component.html',
  styleUrls: ['./withdraw.component.css'],
})
export class WithdrawComponent implements OnInit {
  withdrawForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private _toastService: ToastService,
    private router: Router,
    private loader: LoadermodelService,
    private notificationService: NotificationService,
    private spendingLimitService: SpendingLimitService
  ) {}

  ngOnInit(): void {
    this.initWithDrawForm();
  }

  initWithDrawForm() {
    this.withdrawForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0)]],
      pin: [
        '',
        [Validators.required, Validators.minLength(4), Validators.maxLength(4)],
      ],
    });
  }

  onSubmit(): void {
    if (this.withdrawForm.valid) {
      const amount = this.withdrawForm.get('amount')?.value;
      const pin = this.withdrawForm.get('pin')?.value;

      // Check spending limit
      const limitCheck = this.spendingLimitService.checkIfWillExceedLimit(amount);
      if (limitCheck.isExceeded) {
        // Show confirmation dialog
        const confirmed = confirm(limitCheck.message);
        if (!confirmed) {
          return; // User cancelled the transaction
        }
      }

      this.loader.show('Withdrawing...'); // Show the loader before making the API call
      this.apiService.withdraw(amount, pin).subscribe({
        next: (response: any) => {
          this.loader.hide(); // Hide the loader on successful withdrawal
          this._toastService.success(response.msg);
          this.withdrawForm.reset();
          // Trigger notification refresh
          this.notificationService.triggerRefresh();
          this.router.navigate(['/dashboard']);
          console.log('Withdrawal successful!', response);
        },
        error: (error: any) => {
          this.loader.hide(); // Hide the loader on withdrawal request failure
          this._toastService.error(error.error);
          console.error('Withdrawal failed:', error);
        },
      });
    }
    this.initWithDrawForm();
  }
}
