package com.webapp.bankingportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.Date;

@Entity
@Data
@Table(name = "saved_beneficiaries")
public class SavedBeneficiary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "account_id")
    private Account account;

    @ManyToOne
    @JoinColumn(name = "beneficiary_account_id")
    private Account beneficiaryAccount;

    @Column(nullable = false)
    private Date savedAt;

    private String nickname;
}

