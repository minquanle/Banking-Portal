package com.webapp.bankingportal.service;

import com.webapp.bankingportal.entity.Account;
import com.webapp.bankingportal.entity.User;
import com.webapp.bankingportal.entity.SavedBeneficiary;
import com.webapp.bankingportal.entity.RecentTransfer;
import com.webapp.bankingportal.dto.SavedBeneficiaryDTO;
import com.webapp.bankingportal.dto.RecentTransferDTO;

import java.util.List;

public interface AccountService {

	public Account createAccount(User user);
	public boolean isPinCreated(String accountNumber) ;
	public void createPin(String accountNumber, String password, String pin) ;
	public void updatePin(String accountNumber, String password, String newPIN);
	public void cashDeposit(String accountNumber, String pin, double amount);
	public void cashWithdrawal(String accountNumber, String pin, double amount);
	public void fundTransfer(String sourceAccountNumber, String targetAccountNumber, String pin, double amount);
    public void saveBeneficiary(String accountNumber, String beneficiaryAccountNumber, String nickname);
    List<SavedBeneficiaryDTO> getSavedBeneficiaries(String accountNumber);
    public void removeBeneficiary(String accountNumber, String beneficiaryAccountNumber);
    List<RecentTransferDTO> getRecentTransfers(String accountNumber);

	
	
}
