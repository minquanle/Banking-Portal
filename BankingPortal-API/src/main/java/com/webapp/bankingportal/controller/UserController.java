package com.webapp.bankingportal.controller;

import com.webapp.bankingportal.service.EmailService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.ModelAndView;

import java.util.Map;

import com.webapp.bankingportal.dto.LoginRequest;
import com.webapp.bankingportal.dto.OtpRequest;
import com.webapp.bankingportal.dto.OtpVerificationRequest;
import com.webapp.bankingportal.dto.RegisterOtpRequest;
import com.webapp.bankingportal.entity.User;
import com.webapp.bankingportal.exception.InvalidTokenException;
import com.webapp.bankingportal.service.UserService;
import com.webapp.bankingportal.service.OtpService;

import jakarta.servlet.http.HttpServletRequest;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
@Autowired
    private final UserService userService;
@Autowired
    private EmailService emailService;
@Autowired
    private OtpService otpService;

    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@Valid @RequestBody User user) {
        ResponseEntity<String> response = userService.registerUser(user);

        // Only send email if registration succeeded
        if (response.getStatusCode().is2xxSuccessful()) {
            String emailBody = emailService.getBankStatementEmailTemplate(user.getName(), "Welcome! Your account is created.");
            emailService.sendEmail(user.getEmail(), "Welcome to OneStopBank", emailBody);
        }

        return response;
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest loginRequest, HttpServletRequest request)
            throws InvalidTokenException {
        return userService.login(loginRequest, request);
    }

    @PostMapping("/generate-otp")
    public ResponseEntity<String> generateOtp(@RequestBody OtpRequest otpRequest) {
        return userService.generateOtp(otpRequest);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<String> verifyOtpAndLogin(@RequestBody OtpVerificationRequest otpVerificationRequest)
            throws InvalidTokenException {

        return userService.verifyOtpAndLogin(otpVerificationRequest);
    }

    @PostMapping("/update")
    public ResponseEntity<String> updateUser(@RequestBody User user) {
        return userService.updateUser(user);
    }

    @GetMapping("/logout")
    public ModelAndView logout(@RequestHeader("Authorization") String token)
            throws InvalidTokenException {

        return userService.logout(token);
    }

    @PostMapping("/register/send-otp")
    public ResponseEntity<Map<String, String>> sendRegisterOtp(@Valid @RequestBody User user) {

        // sinh OTP (có thể dùng OtpService hiện tại, lưu theo email)
        String otp = otpService.generateOtpForRegistration(user.getEmail(), user);

        // tạo template email OTP đăng ký (dùng getOtpLoginEmailTemplate hoặc viết hàm mới)
        String emailBody = emailService.getOtpLoginEmailTemplate(
                user.getName(),
                user.getEmail(), // Use email instead of accountNumber since account is not created yet
                otp
        );

        emailService.sendEmail(user.getEmail(), "OTP xác nhận đăng ký", emailBody);
        return ResponseEntity.ok(Map.of("message", "OTP đã được gửi tới email của bạn"));
    }

    // java
    @PostMapping("/register/confirm-otp")
    public ResponseEntity<String> confirmRegisterOtp(@RequestBody RegisterOtpRequest request) {

        String email = request.getUser().getEmail();
        String otp = request.getOtp();

        // Verify OTP first
        boolean valid = otpService.verifyRegistrationOtp(email, otp);

        if (!valid) {
            return ResponseEntity.badRequest().body("OTP không đúng hoặc đã hết hạn");
        }

        // OTP is valid - Get the original user data from cache
        User pendingUser = otpService.getPendingUserData(email);

        if (pendingUser == null) {
            return ResponseEntity.badRequest().body("Dữ liệu đăng ký không tồn tại hoặc đã hết hạn");
        }

        // Register the user with original data from cache
        ResponseEntity<String> response = userService.registerUser(pendingUser);

        if (response.getStatusCode().is2xxSuccessful()) {
            String emailBody = emailService.getBankStatementEmailTemplate(
                    pendingUser.getName(),
                    "Welcome! Your account is created."
            );
            emailService.sendEmail(pendingUser.getEmail(), "Welcome to OneStopBank", emailBody);
        }

        return response;
    }


}
