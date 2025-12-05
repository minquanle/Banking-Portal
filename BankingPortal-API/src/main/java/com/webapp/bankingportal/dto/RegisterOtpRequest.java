// java
package com.webapp.bankingportal.dto;

import com.webapp.bankingportal.entity.User;
import lombok.Data;

@Data
public class RegisterOtpRequest {
    private User user;
    private String otp;
}
