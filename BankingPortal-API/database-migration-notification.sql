-- Migration script for Notification table
-- Database: banking_portal

-- Create notification table
CREATE TABLE IF NOT EXISTS notification (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME NOT NULL,
    amount DOUBLE NOT NULL DEFAULT 0.0,
    related_account_number VARCHAR(255),
    account_id BIGINT NOT NULL,
    CONSTRAINT fk_notification_account FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE,
    INDEX idx_account_id (account_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes for better query performance
CREATE INDEX idx_notification_account_isread ON notification(account_id, is_read);
CREATE INDEX idx_notification_account_created ON notification(account_id, created_at DESC);

-- Sample query to check if table was created successfully
-- SELECT * FROM notification LIMIT 10;

