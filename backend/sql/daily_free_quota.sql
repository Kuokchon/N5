-- 创建每日免费额度表
CREATE TABLE IF NOT EXISTS `daily_free_quota` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `free_balance` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `used` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_date_idx` (`user_id`, `date`),
  CONSTRAINT `fk_daily_free_quota_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 修改会员卡表，添加每日免费额度上限字段
ALTER TABLE `member_cards` 
ADD COLUMN `daily_free_limit` DECIMAL(8,2) NOT NULL DEFAULT 0.00 AFTER `balance`,
ADD COLUMN `last_free_quota_update` DATE DEFAULT NULL COMMENT '上次更新免费额度的日期';

-- 为交易表添加新的交易类型支持
ALTER TABLE `transactions` 
MODIFY COLUMN `type` ENUM('topup', 'deduction', 'free_deduction') NOT NULL COMMENT '交易类型: 充值/扣费/免费额度扣费'; 