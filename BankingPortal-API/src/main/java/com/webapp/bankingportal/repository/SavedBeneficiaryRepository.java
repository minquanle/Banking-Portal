package com.webapp.bankingportal.repository;

import com.webapp.bankingportal.entity.SavedBeneficiary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedBeneficiaryRepository extends JpaRepository<SavedBeneficiary, Long> {
    List<SavedBeneficiary> findByAccount_AccountNumberOrderBySavedAtDesc(String accountNumber);
    boolean existsByAccount_AccountNumberAndBeneficiaryAccount_AccountNumber(String accountNumber, String beneficiaryAccountNumber);
    long countByAccount_AccountNumber(String accountNumber);
    Optional<SavedBeneficiary> findByAccount_AccountNumberAndBeneficiaryAccount_AccountNumber(String accountNumber, String beneficiaryAccountNumber);
}

