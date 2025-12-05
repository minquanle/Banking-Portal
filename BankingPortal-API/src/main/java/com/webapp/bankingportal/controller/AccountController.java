package com.webapp.bankingportal.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.webapp.bankingportal.dto.AmountRequest;
import com.webapp.bankingportal.dto.FundTransferRequest;
import com.webapp.bankingportal.dto.PinRequest;
import com.webapp.bankingportal.dto.PinUpdateRequest;
import com.webapp.bankingportal.dto.SavedBeneficiaryDTO;
import com.webapp.bankingportal.dto.RecentTransferDTO;
import com.webapp.bankingportal.service.AccountService;
import com.webapp.bankingportal.service.TransactionService;
import com.webapp.bankingportal.util.ApiMessages;
import com.webapp.bankingportal.util.JsonUtil;
import com.webapp.bankingportal.util.LoggedinUser;
import com.webapp.bankingportal.dto.SaveBeneficiaryRequest;
import com.webapp.bankingportal.entity.RecentTransfer;
import com.webapp.bankingportal.entity.SavedBeneficiary;
import com.webapp.bankingportal.dto.TransactionDTO;

import lombok.RequiredArgsConstructor;
// abcdhdsfdsfhfhjdkf
@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;
    private final TransactionService transactionService;

    @GetMapping("/pin/check")
    public ResponseEntity<Map<String, Boolean>> checkAccountPIN() {
        boolean isPINValid = accountService.isPinCreated(LoggedinUser.getAccountNumber());
        return ResponseEntity.ok(Map.of("hasPIN", isPINValid));
    }

    @PostMapping("/pin/create")
    public ResponseEntity<String> createPIN(@RequestBody PinRequest pinRequest) {
        accountService.createPin(
                LoggedinUser.getAccountNumber(),
                pinRequest.password(),
                pinRequest.pin());

        return ResponseEntity.ok(ApiMessages.PIN_CREATION_SUCCESS.getMessage());
    }

    @PostMapping("/pin/update")
    public ResponseEntity<String> updatePIN(@RequestBody PinUpdateRequest pinUpdateRequest) {
        accountService.updatePin(
                LoggedinUser.getAccountNumber(),
                pinUpdateRequest.password(),
                pinUpdateRequest.newPin());

        return ResponseEntity.ok(ApiMessages.PIN_UPDATE_SUCCESS.getMessage());
    }

    @PostMapping("/deposit")
    public ResponseEntity<String> cashDeposit(@RequestBody AmountRequest amountRequest) {
        accountService.cashDeposit(
                LoggedinUser.getAccountNumber(),
                amountRequest.pin(),
                amountRequest.amount());

        return ResponseEntity.ok(ApiMessages.CASH_DEPOSIT_SUCCESS.getMessage());
    }

    @PostMapping("/withdraw")
    public ResponseEntity<String> cashWithdrawal(@RequestBody AmountRequest amountRequest) {
        accountService.cashWithdrawal(
                LoggedinUser.getAccountNumber(),
                amountRequest.pin(),
                amountRequest.amount());

        return ResponseEntity.ok(ApiMessages.CASH_WITHDRAWAL_SUCCESS.getMessage());
    }

    @PostMapping("/fund-transfer")
    public ResponseEntity<String> fundTransfer(@RequestBody FundTransferRequest fundTransferRequest) {
        accountService.fundTransfer(
                LoggedinUser.getAccountNumber(),
                fundTransferRequest.targetAccountNumber(),
                fundTransferRequest.pin(),
                fundTransferRequest.amount());

        return ResponseEntity.ok(ApiMessages.CASH_TRANSFER_SUCCESS.getMessage());
    }

    @GetMapping("/transactions")
    public ResponseEntity<String> getAllTransactionsByAccountNumber() {
        List<TransactionDTO> transactions = transactionService
                .getAllTransactionsByAccountNumber(LoggedinUser.getAccountNumber());
        return ResponseEntity.ok(JsonUtil.toJson(transactions));
    }
    @GetMapping("/send-statement")
    public ResponseEntity<String> sendBankStatement() {
        String accountNumber = LoggedinUser.getAccountNumber(); // Get logged-in user account
        transactionService.sendBankStatementByEmail(accountNumber);
        return ResponseEntity.ok("{\"message\": \"Bank statement sent to your email.\"}");
    }

    @PostMapping("/beneficiaries/save")
    public ResponseEntity<?> saveBeneficiary(@RequestBody SaveBeneficiaryRequest request) {
        accountService.saveBeneficiary(
                request.getAccountNumber(),
                request.getBeneficiaryAccountNumber(),
                request.getNickname()
        );
        return ResponseEntity.ok(Map.of("message", "Đã lưu người nhận thành công", "success", true));
    }

    @GetMapping("/beneficiaries")
    public ResponseEntity<List<SavedBeneficiaryDTO>> getSavedBeneficiaries(@RequestParam String accountNumber) {
        return ResponseEntity.ok(accountService.getSavedBeneficiaries(accountNumber));
    }

    @GetMapping("/recent-transfers")
    public ResponseEntity<List<RecentTransferDTO>> getRecentTransfers(@RequestParam String accountNumber) {
        return ResponseEntity.ok(accountService.getRecentTransfers(accountNumber));
    }


}
