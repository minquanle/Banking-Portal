package com.webapp.bankingportal.service;

import java.util.Date;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.webapp.bankingportal.entity.Account;
import com.webapp.bankingportal.entity.NotificationType;
import com.webapp.bankingportal.entity.Transaction;
import com.webapp.bankingportal.entity.TransactionType;
import com.webapp.bankingportal.entity.User;
import com.webapp.bankingportal.entity.SavedBeneficiary;
import com.webapp.bankingportal.entity.RecentTransfer;
import com.webapp.bankingportal.dto.SavedBeneficiaryDTO;
import com.webapp.bankingportal.dto.RecentTransferDTO;
import com.webapp.bankingportal.exception.FundTransferException;
import com.webapp.bankingportal.exception.InsufficientBalanceException;
import com.webapp.bankingportal.exception.InvalidAmountException;
import com.webapp.bankingportal.exception.InvalidPinException;
import com.webapp.bankingportal.exception.InvalidPasswordException;
import com.webapp.bankingportal.exception.NotFoundException;
import com.webapp.bankingportal.exception.UnauthorizedException;
import com.webapp.bankingportal.repository.AccountRepository;
import com.webapp.bankingportal.repository.TransactionRepository;
import com.webapp.bankingportal.repository.SavedBeneficiaryRepository;
import com.webapp.bankingportal.repository.RecentTransferRepository;
import com.webapp.bankingportal.util.ApiMessages;

import lombok.RequiredArgsConstructor;
import lombok.val;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {
@Autowired
    private final AccountRepository accountRepository;
    @Autowired
    private final PasswordEncoder passwordEncoder;
    @Autowired
    private final TransactionRepository transactionRepository;
    @Autowired
    private final NotificationService notificationService;

    @Override
    public Account createAccount(User user) {
        val account = new Account();
        account.setAccountNumber(generateUniqueAccountNumber());
        account.setBalance(0.0);
        account.setUser(user);
        return accountRepository.save(account);
    }

    @Override
    public boolean isPinCreated(String accountNumber) {
        val account = accountRepository.findByAccountNumber(accountNumber);
        if (account == null) {
            throw new NotFoundException(ApiMessages.ACCOUNT_NOT_FOUND.getMessage());
        }

        return account.getPin() != null;
    }

    private String generateUniqueAccountNumber() {
        String accountNumber;
        do {
            // Generate a UUID as the account number
            accountNumber = UUID.randomUUID().toString().replaceAll("-", "").substring(0, 6);
        } while (accountRepository.findByAccountNumber(accountNumber) != null);

        return accountNumber;
    }

    private void validatePin(String accountNumber, String pin) {
        val account = accountRepository.findByAccountNumber(accountNumber);
        if (account == null) {
            throw new NotFoundException(ApiMessages.ACCOUNT_NOT_FOUND.getMessage());
        }

        if (account.getPin() == null) {
            throw new InvalidPinException(ApiMessages.PIN_NOT_CREATED.getMessage());
        }

        if (pin == null || pin.isEmpty()) {
            throw new InvalidPinException(ApiMessages.PIN_EMPTY_ERROR.getMessage());
        }

        if (!passwordEncoder.matches(pin, account.getPin())) {
            throw new InvalidPinException(ApiMessages.PIN_INVALID_ERROR.getMessage());
        }
    }

    private void validatePassword(String accountNumber, String password) {
        val account = accountRepository.findByAccountNumber(accountNumber);
        if (account == null) {
            throw new NotFoundException(ApiMessages.ACCOUNT_NOT_FOUND.getMessage());
        }

        if (password == null || password.isEmpty()) {
            throw new InvalidPasswordException(ApiMessages.PASSWORD_EMPTY_ERROR.getMessage());
        }

        if (!passwordEncoder.matches(password, account.getUser().getPassword())) {
            throw new InvalidPasswordException(ApiMessages.PASSWORD_INVALID_ERROR.getMessage());
        }
    }

    @Override
    public void createPin(String accountNumber, String password, String pin) {
        validatePassword(accountNumber, password);

        val account = accountRepository.findByAccountNumber(accountNumber);
        if (account.getPin() != null) {
            throw new InvalidPinException(ApiMessages.PIN_ALREADY_EXISTS.getMessage());
        }

        if (pin == null || pin.isEmpty()) {
            throw new InvalidPinException(ApiMessages.PIN_EMPTY_ERROR.getMessage());
        }

        if (!pin.matches("[0-9]{4}")) {
            throw new InvalidPinException(ApiMessages.PIN_FORMAT_INVALID_ERROR.getMessage());
        }

        account.setPin(passwordEncoder.encode(pin));
        accountRepository.save(account);
    }

    @Override
    public void updatePin(String accountNumber, String password, String newPin) {
        log.info("Updating PIN for account: {}", accountNumber);

        validatePassword(accountNumber, password);

        val account = accountRepository.findByAccountNumber(accountNumber);

        if (newPin == null || newPin.isEmpty()) {
            throw new InvalidPinException(ApiMessages.PIN_EMPTY_ERROR.getMessage());
        }

        if (!newPin.matches("[0-9]{4}")) {
            throw new InvalidPinException(ApiMessages.PIN_FORMAT_INVALID_ERROR.getMessage());
        }

        account.setPin(passwordEncoder.encode(newPin));
        accountRepository.save(account);
    }

    private void validateAmount(double amount) {
        if (amount <= 0) {
            throw new InvalidAmountException(ApiMessages.AMOUNT_NEGATIVE_ERROR.getMessage());
        }

        if (amount % 100 != 0) {
            throw new InvalidAmountException(ApiMessages.AMOUNT_NOT_MULTIPLE_OF_100_ERROR.getMessage());
        }
    }

    @Transactional
    @Override
    public void cashDeposit(String accountNumber, String pin, double amount) {
        validatePin(accountNumber, pin);
        validateAmount(amount);

        val account = accountRepository.findByAccountNumber(accountNumber);
        val currentBalance = account.getBalance();
        val newBalance = currentBalance + amount;
        account.setBalance(newBalance);
        accountRepository.save(account);

        val transaction = new Transaction();
        transaction.setAmount(amount);
        transaction.setTransactionType(TransactionType.CASH_DEPOSIT);
        transaction.setTransactionDate(new Date());
        transaction.setSourceAccount(account);
        transactionRepository.save(transaction);

        // Create notification for deposit
        notificationService.createNotification(
            account,
            "Tiền gửi thành công",
            String.format("Bạn đã nạp %.0f VNĐ vào tài khoản. Số dư mới: %.0f VNĐ", amount, newBalance),
            NotificationType.DEPOSIT,
            amount,
            null
        );
    }

    @Transactional
    @Override
    public void cashWithdrawal(String accountNumber, String pin, double amount) {
        validatePin(accountNumber, pin);
        validateAmount(amount);

        val account = accountRepository.findByAccountNumber(accountNumber);
        val currentBalance = account.getBalance();
        if (currentBalance < amount) {
            throw new InsufficientBalanceException(ApiMessages.BALANCE_INSUFFICIENT_ERROR.getMessage());
        }

        val newBalance = currentBalance - amount;
        account.setBalance(newBalance);
        accountRepository.save(account);

        val transaction = new Transaction();
        transaction.setAmount(amount);
        transaction.setTransactionType(TransactionType.CASH_WITHDRAWAL);
        transaction.setTransactionDate(new Date());
        transaction.setSourceAccount(account);
        transactionRepository.save(transaction);

        // Create notification for withdrawal
        notificationService.createNotification(
            account,
            "Rút tiền thành công",
            String.format("Bạn đã rút %.0f VNĐ từ tài khoản. Số dư mới: %.0f VNĐ", amount, newBalance),
            NotificationType.WITHDRAW,
            amount,
            null
        );
    }

    @Transactional
    @Override
    public void fundTransfer(String sourceAccountNumber, String targetAccountNumber, String pin, double amount) {
        validatePin(sourceAccountNumber, pin);
        validateAmount(amount);

        if (sourceAccountNumber.equals(targetAccountNumber)) {
            throw new FundTransferException(ApiMessages.CASH_TRANSFER_SAME_ACCOUNT_ERROR.getMessage());
        }

        val targetAccount = accountRepository.findByAccountNumber(targetAccountNumber);
        if (targetAccount == null) {
            throw new NotFoundException(ApiMessages.ACCOUNT_NOT_FOUND.getMessage());
        }

        val sourceAccount = accountRepository.findByAccountNumber(sourceAccountNumber);
        val sourceBalance = sourceAccount.getBalance();
        if (sourceBalance < amount) {
            throw new InsufficientBalanceException(ApiMessages.BALANCE_INSUFFICIENT_ERROR.getMessage());
        }

        val newSourceBalance = sourceBalance - amount;
        sourceAccount.setBalance(newSourceBalance);
        accountRepository.save(sourceAccount);

        val targetBalance = targetAccount.getBalance();
        val newTargetBalance = targetBalance + amount;
        targetAccount.setBalance(newTargetBalance);
        accountRepository.save(targetAccount);

        val transaction = new Transaction();
        transaction.setAmount(amount);
        transaction.setTransactionType(TransactionType.CASH_TRANSFER);
        transaction.setTransactionDate(new Date());
        transaction.setSourceAccount(sourceAccount);
        transaction.setTargetAccount(targetAccount);
        transactionRepository.save(transaction);

        // Update recent transfers
        RecentTransfer recent = recentTransferRepository.findByAccount_AccountNumberAndRecipientAccount_AccountNumber(
                sourceAccountNumber, targetAccountNumber).orElse(null);

        if (recent == null) {
            recent = new RecentTransfer();
            recent.setAccount(sourceAccount);
            recent.setRecipientAccount(targetAccount);
        }
        recent.setLastTransferDate(new Date());
        recentTransferRepository.save(recent);

        // Create notification for sender
        notificationService.createNotification(
            sourceAccount,
            "Chuyển tiền thành công",
            String.format("Bạn đã chuyển %.0f VNĐ đến tài khoản %s. Số dư mới: %.0f VNĐ",
                amount, targetAccountNumber, newSourceBalance),
            NotificationType.TRANSFER_SENT,
            amount,
            targetAccountNumber
        );

        // Create notification for receiver
        notificationService.createNotification(
            targetAccount,
            "Nhận tiền thành công",
            String.format("Bạn đã nhận %.0f VNĐ từ tài khoản %s. Số dư mới: %.0f VNĐ",
                amount, sourceAccountNumber, newTargetBalance),
            NotificationType.TRANSFER_RECEIVED,
            amount,
            sourceAccountNumber
        );
    }

    @Autowired
    private SavedBeneficiaryRepository savedBeneficiaryRepository;
    @Autowired
    private RecentTransferRepository recentTransferRepository;

    @Override
    public void saveBeneficiary(String accountNumber, String beneficiaryAccountNumber, String nickname) {
        log.info("Saving beneficiary for account: {} - beneficiary: {}", accountNumber, beneficiaryAccountNumber);

        if (accountNumber.equals(beneficiaryAccountNumber)) {
            throw new IllegalArgumentException("Không thể lưu tài khoản của chính mình");
        }

        val account = accountRepository.findByAccountNumber(accountNumber);
        val beneficiary = accountRepository.findByAccountNumber(beneficiaryAccountNumber);

        if (account == null) {
            throw new NotFoundException("Không tìm thấy tài khoản của bạn");
        }

        if (beneficiary == null) {
            throw new NotFoundException("Không tìm thấy tài khoản người nhận");
        }

        // Check if already exists
        val existingSavedBeneficiary = savedBeneficiaryRepository
                .findByAccount_AccountNumberAndBeneficiaryAccount_AccountNumber(accountNumber, beneficiaryAccountNumber);

        if (existingSavedBeneficiary.isPresent()) {
            // Update existing
            val saved = existingSavedBeneficiary.get();
            if (nickname != null && !nickname.isEmpty()) {
                saved.setNickname(nickname);
            }
            saved.setSavedAt(new Date());
            savedBeneficiaryRepository.save(saved);
            log.info("Beneficiary updated successfully");
        } else {
            // Check limit before adding new
            long count = savedBeneficiaryRepository.countByAccount_AccountNumber(accountNumber);
            if (count >= 5) {
                throw new IllegalStateException("Đã đạt giới hạn 5 người nhận được lưu");
            }

            // Add new
            val saved = new SavedBeneficiary();
            saved.setAccount(account);
            saved.setBeneficiaryAccount(beneficiary);
            saved.setNickname(nickname != null ? nickname : beneficiary.getUser().getName());
            saved.setSavedAt(new Date());
            savedBeneficiaryRepository.save(saved);
            log.info("Beneficiary saved successfully");
        }
    }

    @Override
    public List<SavedBeneficiaryDTO> getSavedBeneficiaries(String accountNumber) {
        log.info("Getting saved beneficiaries for account: {}", accountNumber);
        List<SavedBeneficiary> saved = savedBeneficiaryRepository.findByAccount_AccountNumberOrderBySavedAtDesc(accountNumber);
        log.info("Found {} saved beneficiaries", saved.size());
        
        return saved.stream().map(s -> new SavedBeneficiaryDTO(
            s.getId(),
            s.getBeneficiaryAccount().getAccountNumber(),
            s.getBeneficiaryAccount().getUser().getName(),
            s.getNickname(),
            s.getSavedAt()
        )).toList();
    }

    @Override
    public void removeBeneficiary(String accountNumber, String beneficiaryAccountNumber) {
        // Implement delete logic
    }

    @Override
    public List<RecentTransferDTO> getRecentTransfers(String accountNumber) {
        log.info("Getting recent transfers for account: {}", accountNumber);
        List<RecentTransfer> transfers = recentTransferRepository.findTop5ByAccount_AccountNumberOrderByLastTransferDateDesc(accountNumber);
        log.info("Found {} recent transfers", transfers.size());
        
        return transfers.stream().map(t -> new RecentTransferDTO(
            t.getId(),
            t.getRecipientAccount().getAccountNumber(),
            t.getRecipientAccount().getUser().getName(),
            t.getLastTransferDate()
        )).toList();
    }


}
