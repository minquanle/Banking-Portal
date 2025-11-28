package com.webapp.bankingportal.entity;

import java.util.Date;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String message;

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    private boolean isRead;
    private Date createdAt;
    private double amount;
    private String relatedAccountNumber; // Account number of sender/receiver

    @ManyToOne
    @JoinColumn(name = "account_id")
    private Account account;

    @PrePersist
    protected void onCreate() {
        createdAt = new Date();
        isRead = false;
    }
}

