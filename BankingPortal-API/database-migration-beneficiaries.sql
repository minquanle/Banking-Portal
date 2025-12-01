-- Create table for saved beneficiaries
CREATE TABLE IF NOT EXISTS saved_beneficiaries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id BIGINT NOT NULL,
    beneficiary_account_id BIGINT NOT NULL,
    nickname VARCHAR(100),
    saved_at DATETIME NOT NULL,
    FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE,
    FOREIGN KEY (beneficiary_account_id) REFERENCES account(account_id) ON DELETE CASCADE,
    UNIQUE KEY unique_beneficiary (account_id, beneficiary_account_id)
);

-- Create table for recent transfers
CREATE TABLE IF NOT EXISTS recent_transfers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id BIGINT NOT NULL,
    recipient_account_id BIGINT NOT NULL,
    last_transfer_date DATETIME NOT NULL,
    FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_account_id) REFERENCES account(account_id) ON DELETE CASCADE,
    UNIQUE KEY unique_transfer (account_id, recipient_account_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_saved_beneficiaries_account ON saved_beneficiaries(account_id);
CREATE INDEX idx_recent_transfers_account ON recent_transfers(account_id);
CREATE INDEX idx_recent_transfers_date ON recent_transfers(last_transfer_date DESC);

