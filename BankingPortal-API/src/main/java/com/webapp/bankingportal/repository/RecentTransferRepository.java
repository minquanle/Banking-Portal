package com.webapp.bankingportal.repository;

import com.webapp.bankingportal.entity.RecentTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecentTransferRepository extends JpaRepository<RecentTransfer, Long> {
    List<RecentTransfer> findTop5ByAccount_AccountNumberOrderByLastTransferDateDesc(String accountNumber);
    Optional<RecentTransfer> findByAccount_AccountNumberAndRecipientAccount_AccountNumber(String accountNumber, String recipientAccountNumber);
}

