package com.webapp.bankingportal.dto;

import java.util.Date;

import com.webapp.bankingportal.entity.NotificationType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private Long id;
    private String title;
    private String message;
    private NotificationType type;
    private boolean isRead;
    private Date createdAt;
    private double amount;
    private String relatedAccountNumber;
}

