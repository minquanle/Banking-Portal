package com.webapp.bankingportal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecentTransferDTO {
    private Long id;
    private String recipientAccountNumber;
    private String recipientName;
    private Date lastTransferDate;
}
