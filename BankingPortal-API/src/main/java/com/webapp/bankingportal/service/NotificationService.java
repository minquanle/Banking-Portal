package com.webapp.bankingportal.service;

import java.util.List;

import com.webapp.bankingportal.dto.NotificationDTO;
import com.webapp.bankingportal.entity.Account;
import com.webapp.bankingportal.entity.NotificationType;

public interface NotificationService {
    void createNotification(Account account, String title, String message, NotificationType type, double amount, String relatedAccountNumber);
    List<NotificationDTO> getNotificationsByAccount(String accountNumber);
    List<NotificationDTO> getUnreadNotifications(String accountNumber);
    void markAsRead(Long notificationId);
    void markAllAsRead(String accountNumber);
    long getUnreadCount(String accountNumber);
    void deleteNotification(Long notificationId);
}

