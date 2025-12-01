package com.webapp.bankingportal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SavedBeneficiaryDTO {
    private Long id;
    private String beneficiaryAccountNumber;
    private String beneficiaryName;
    private String nickname;
    private Date savedAt;
}
