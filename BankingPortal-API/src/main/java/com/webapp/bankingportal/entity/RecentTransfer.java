package com.webapp.bankingportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.Date;

@Entity
@Data
@Table(name = "recent_transfers")
public class RecentTransfer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "account_id")
    private Account account;

    @ManyToOne
    @JoinColumn(name = "recipient_account_id")
    private Account recipientAccount;

    @Column(nullable = false)
    private Date lastTransferDate;
}

