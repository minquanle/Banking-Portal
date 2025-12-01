import { ToastService } from 'angular-toastify';
import { ApiService } from 'src/app/services/api.service';
import { AuthService } from 'src/app/services/auth.service';
import { LoadermodelService } from 'src/app/services/loadermodel.service';
import { NotificationService } from 'src/app/services/notification.service';
import { SpendingLimitService } from 'src/app/services/spending-limit.service';

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-fund-transfer',
  templateUrl: './fund-transfer.component.html',
  styleUrls: ['./fund-transfer.component.css'],
})
export class FundTransferComponent implements OnInit {
  fundTransferForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private _toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute,
    private loader: LoadermodelService,
    private notificationService: NotificationService,
    private spendingLimitService: SpendingLimitService
  ) {}

  ngOnInit(): void {
    this.initFundTransferForm();

    // Check for query params and pre-fill target account
    this.route.queryParams.subscribe((params) => {
      if (params['targetAccount']) {
        this.fundTransferForm.patchValue({
          targetAccountNumber: params['targetAccount'],
        });
        console.log('Pre-filled target account:', params['targetAccount']);
      }
    });
  }

  initFundTransferForm(): void {
    this.fundTransferForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0)]], // Validate that amount is a positive number
      pin: [
        '',
        [Validators.required, Validators.minLength(4), Validators.maxLength(4)],
      ],
      targetAccountNumber: ['', [Validators.required]],
      saveBeneficiary: [false],
      nickname: [''],
    });
  }

  onSubmit(): void {
    if (this.fundTransferForm?.valid) {
      const amount = this.fundTransferForm.get('amount')?.value;
      const pin = this.fundTransferForm.get('pin')?.value;
      const targetAccountNumber = this.fundTransferForm.get(
        'targetAccountNumber'
      )?.value;
      const saveBeneficiary = this.fundTransferForm.get('saveBeneficiary')
        ?.value;
      const nickname = this.fundTransferForm.get('nickname')?.value;

      console.log('Transfer form values:', {
        amount,
        targetAccountNumber,
        saveBeneficiary,
        nickname,
      });

      if (amount !== null && pin !== null && targetAccountNumber !== null) {
        // Check spending limit
        const limitCheck = this.spendingLimitService.checkIfWillExceedLimit(amount);
        if (limitCheck.isExceeded) {
          // Show confirmation dialog
          const confirmed = confirm(limitCheck.message);
          if (!confirmed) {
            return; // User cancelled the transaction
          }
        }

        this.loader.show('Transferring funds...'); // Show the loader before making the API call
        this.apiService
          .fundTransfer(amount, pin, targetAccountNumber)
          .subscribe({
            next: (response: any) => {
              this.loader.hide(); // Hide the loader on successful fund transfer

              console.log('Transfer successful, saveBeneficiary:', saveBeneficiary);

              // Save beneficiary if checkbox is checked - DO THIS BEFORE RESET
              if (saveBeneficiary === true && targetAccountNumber) {
                console.log('Calling saveBeneficiaryToBackend with:', targetAccountNumber, nickname);
                this.saveBeneficiaryToBackend(targetAccountNumber, nickname || targetAccountNumber);
              }

              // Handle successful fund transfer if needed
              this._toastService.success(response.msg || 'Chuyển tiền thành công!');

              // Trigger notification refresh
              this.notificationService.triggerRefresh();

              // Reset form AFTER saving beneficiary
              this.fundTransferForm.reset();

              // Wait a moment then navigate
              setTimeout(() => {
                this.router.navigate(['/dashboard']);
              }, 500);

              console.log('Fund transfer successful!', response);
            },
            error: (error: any) => {
              this.loader.hide(); // Hide the loader on fund transfer request failure
              // Handle error if the fund transfer request fails
              this._toastService.error(error.error?.msg || error.error || 'Chuyển tiền thất bại');
              console.error('Fund transfer failed:', error);
            },
          });
      }
    }
  }

  private saveBeneficiaryToBackend(
    beneficiaryAccountNumber: string,
    nickname: string
  ): void {
    console.log('saveBeneficiaryToBackend called - Getting user details first...');

    // Get accountNumber from AuthService instead of localStorage
    this.authService.getUserDetails().subscribe({
      next: (user: any) => {
        const accountNumber = user?.accountNumber;
        console.log('saveBeneficiaryToBackend called with:', {
          accountNumber,
          beneficiaryAccountNumber,
          nickname
        });

        if (accountNumber) {
          this.apiService
            .saveBeneficiary(accountNumber, beneficiaryAccountNumber, nickname)
            .subscribe({
              next: (response) => {
                console.log('✓ Đã lưu người nhận thành công - Response:', response);
                this._toastService.info('Đã lưu người nhận');
              },
              error: (err) => {
                console.error('✗ LỖI khi lưu người nhận - Full error:', err);
                console.error('✗ Error status:', err.status);
                console.error('✗ Error message:', err.error);
                console.error('✗ Error body:', JSON.stringify(err));
                // Show error to help debug
                this._toastService.error('Không thể lưu người nhận: ' + (err.error?.message || err.message || 'Lỗi không xác định'));
              },
            });
        } else {
          console.error('✗ Không tìm thấy accountNumber trong user details');
          this._toastService.error('Không thể lưu người nhận: Không tìm thấy thông tin tài khoản');
        }
      },
      error: (err) => {
        console.error('✗ Không thể lấy thông tin user:', err);
        this._toastService.error('Không thể lưu người nhận: Không thể lấy thông tin tài khoản');
      }
    });
  }
}
