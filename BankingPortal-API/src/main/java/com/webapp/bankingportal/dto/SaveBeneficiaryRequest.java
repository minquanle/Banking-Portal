package com.webapp.bankingportal.dto;

import lombok.Data;

@Data
public class SaveBeneficiaryRequest {
    private String accountNumber;
    private String beneficiaryAccountNumber;
    private String nickname;
}

