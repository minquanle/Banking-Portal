package com.webapp.bankingportal.service;

import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.webapp.bankingportal.dto.NotificationDTO;
import com.webapp.bankingportal.entity.Account;
import com.webapp.bankingportal.entity.Notification;
import com.webapp.bankingportal.entity.NotificationType;
import com.webapp.bankingportal.repository.AccountRepository;
import com.webapp.bankingportal.repository.NotificationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final AccountRepository accountRepository;

    @Override
    @Transactional
    public void createNotification(Account account, String title, String message,
                                  NotificationType type, double amount, String relatedAccountNumber) {
        log.info("Creating notification for account: {}", account.getAccountNumber());

        Notification notification = Notification.builder()
                .account(account)
                .title(title)
                .message(message)
                .type(type)
                .amount(amount)
                .relatedAccountNumber(relatedAccountNumber)
                .build();

        notificationRepository.save(notification);
        log.info("Notification created successfully");
    }

    @Override
    public List<NotificationDTO> getNotificationsByAccount(String accountNumber) {
        log.info("Getting all notifications for account: {}", accountNumber);
        Account account = accountRepository.findByAccountNumber(accountNumber);

        List<Notification> notifications = notificationRepository.findByAccountOrderByCreatedAtDesc(account);

        return notifications.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationDTO> getUnreadNotifications(String accountNumber) {
        log.info("Getting unread notifications for account: {}", accountNumber);
        Account account = accountRepository.findByAccountNumber(accountNumber);

        List<Notification> notifications = notificationRepository.findByAccountAndIsReadFalseOrderByCreatedAtDesc(account);

        return notifications.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId) {
        log.info("Marking notification as read: {}", notificationId);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(String accountNumber) {
        log.info("Marking all notifications as read for account: {}", accountNumber);
        Account account = accountRepository.findByAccountNumber(accountNumber);

        List<Notification> unreadNotifications = notificationRepository.findByAccountAndIsReadFalseOrderByCreatedAtDesc(account);

        unreadNotifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(unreadNotifications);
    }

    @Override
    public long getUnreadCount(String accountNumber) {
        log.info("Getting unread count for account: {}", accountNumber);
        Account account = accountRepository.findByAccountNumber(accountNumber);
        return notificationRepository.countByAccountAndIsReadFalse(account);
    }

    @Override
    @Transactional
    public void deleteNotification(Long notificationId) {
        log.info("Deleting notification: {}", notificationId);
        notificationRepository.deleteById(notificationId);
    }

    private NotificationDTO convertToDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .amount(notification.getAmount())
                .relatedAccountNumber(notification.getRelatedAccountNumber())
                .build();
    }
}

