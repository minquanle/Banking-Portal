package com.webapp.bankingportal.service;

import java.util.concurrent.CompletableFuture;
import com.webapp.bankingportal.entity.User;

public interface OtpService {

	String generateOTP(String accountNumber);

	public CompletableFuture<Void> sendOTPByEmail(String email,String name,String accountNumber, String otp) ;	
	public boolean validateOTP(String accountNumber, String otp);
    public String generateOtpForRegistration(String email, User pendingUser);
    public boolean verifyRegistrationOtp(String email, String otp);
    public User getPendingUserData(String email);

}
