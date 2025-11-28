package com.webapp.bankingportal.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.webapp.bankingportal.entity.Account;
import com.webapp.bankingportal.entity.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByAccountOrderByCreatedAtDesc(Account account);
    List<Notification> findByAccountAndIsReadFalseOrderByCreatedAtDesc(Account account);
    long countByAccountAndIsReadFalse(Account account);
}

