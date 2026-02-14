CREATE TABLE IF NOT EXISTS `service_categories` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `service_categories_id_pk` PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `service_items` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `category_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `wechat_id` VARCHAR(100) NULL,
  `wechat_qr_code` TEXT NULL,
  `contact_name` VARCHAR(100) NULL,
  `contact_phone` VARCHAR(32) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `service_items_id_pk` PRIMARY KEY (`id`),
  CONSTRAINT `service_items_category_id_service_categories_id_fk`
    FOREIGN KEY (`category_id`)
    REFERENCES `service_categories` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

CREATE INDEX `service_items_category_id_idx` ON `service_items` (`category_id`);
