package com.webapp.bankingportal.entity;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.Date;

@Entity
@Data
@Table(name = "recent_transfers",
    indexes = { @Index(name = "idx_recent_transfers_account", columnList = "account_id"),
            @Index(name = "idx_recent_transfers_date", columnList = "last_transfer_date DESC")}
)
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

