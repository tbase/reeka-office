CREATE TABLE `admin` (
	`id` varchar(128) NOT NULL,
	`name` varchar(256),
	`email` varchar(256) NOT NULL,
	`email_verified` boolean,
	`image` varchar(512),
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `admin_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_email_idx` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `admin_account` (
	`id` varchar(128) NOT NULL,
	`account_id` varchar(128) NOT NULL,
	`provider_id` varchar(128) NOT NULL,
	`user_id` varchar(128) NOT NULL,
	`access_token` varchar(512),
	`refresh_token` varchar(512),
	`id_token` varchar(2048),
	`access_token_expires_at` datetime,
	`refresh_token_expires_at` datetime,
	`scope` varchar(512),
	`password` varchar(256),
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `admin_account_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_session` (
	`id` varchar(128) NOT NULL,
	`expires_at` datetime NOT NULL,
	`token` varchar(128) NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	`ip_address` varchar(64),
	`user_agent` varchar(512),
	`user_id` varchar(128) NOT NULL,
	CONSTRAINT `admin_session_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_session_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `admin_verification` (
	`id` varchar(128) NOT NULL,
	`identifier` varchar(256) NOT NULL,
	`value` varchar(256) NOT NULL,
	`expires_at` datetime NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `admin_verification_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_domain_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`aggregate_type` varchar(50) NOT NULL,
	`aggregate_id` varchar(50) NOT NULL,
	`event_type` varchar(100) NOT NULL,
	`payload` json NOT NULL,
	`occurred_at` datetime NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `agent_domain_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_hierarchy` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_code` varchar(8),
	`leader_code` varchar(8),
	`hierarchy` int NOT NULL,
	CONSTRAINT `agent_hierarchy_id` PRIMARY KEY(`id`),
	CONSTRAINT `agent_hierarchy_agent_leader_udx` UNIQUE(`agent_code`,`leader_code`)
);
--> statement-breakpoint
CREATE TABLE `agent_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_code` varchar(8) NOT NULL,
	`category` varchar(32) NOT NULL,
	`action` varchar(32) NOT NULL,
	`period_year` int,
	`period_month` int,
	`source` varchar(64) NOT NULL,
	`changes` json NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `agent_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_code` varchar(8),
	`name` varchar(100) NOT NULL,
	`join_date` date,
	`designation` int,
	`finacing_scheme` json,
	`leader_code` varchar(8),
	`last_promotion_date` date,
	`agency` varchar(100),
	`division` varchar(100),
	`branch` varchar(100),
	`unit` varchar(100),
	`deleted_at` datetime,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`),
	CONSTRAINT `agents_agent_code_unique` UNIQUE(`agent_code`)
);
--> statement-breakpoint
CREATE TABLE `cms_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`hide_content` int NOT NULL DEFAULT 0,
	`field_schema` json NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `cms_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `cms_categories_slug_udx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `cms_contents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`fields` json NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `cms_contents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_customer_profile_values` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_id` int NOT NULL,
	`customer_id` int NOT NULL,
	`customer_type_id` int NOT NULL,
	`field_id` int NOT NULL,
	`value` text NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `crm_customer_profile_values_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_customer_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`enabled` int NOT NULL DEFAULT 1,
	`supports_opportunity` int NOT NULL DEFAULT 0,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `crm_customer_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_id` int NOT NULL,
	`customer_type_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`gender` varchar(1),
	`phone` varchar(50),
	`wechat` varchar(100),
	`tags` json NOT NULL,
	`note` text,
	`archived_at` datetime,
	`last_followed_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `crm_customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_follow_up_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_id` int NOT NULL,
	`customer_id` int NOT NULL,
	`customer_type_id` int NOT NULL,
	`status_id` int NOT NULL,
	`status_name_snapshot` varchar(100) NOT NULL,
	`followed_at` datetime NOT NULL,
	`content` text NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `crm_follow_up_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_follow_up_statuses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customer_type_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`enabled` int NOT NULL DEFAULT 1,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `crm_follow_up_statuses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_profile_fields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customer_type_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`enabled` int NOT NULL DEFAULT 1,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `crm_profile_fields_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_performance_monthly` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_code` varchar(8) NOT NULL,
	`year` int NOT NULL,
	`month` int NOT NULL,
	`nsc` int NOT NULL DEFAULT 0,
	`nsc_sum` int NOT NULL DEFAULT 0,
	`net_afyc_sum` int NOT NULL DEFAULT 0,
	`net_afyp` int NOT NULL DEFAULT 0,
	`net_afyp_sum` int NOT NULL DEFAULT 0,
	`net_afyp_assigned` int NOT NULL DEFAULT 0,
	`net_afyp_assigned_sum` int NOT NULL DEFAULT 0,
	`nsc_hp` int NOT NULL DEFAULT 0,
	`nsc_hp_sum` int NOT NULL DEFAULT 0,
	`net_afyp_hp` int NOT NULL DEFAULT 0,
	`net_afyp_hp_sum` int NOT NULL DEFAULT 0,
	`net_afyp_h` int NOT NULL DEFAULT 0,
	`net_afyp_h_sum` int NOT NULL DEFAULT 0,
	`net_case_h` int NOT NULL DEFAULT 0,
	`net_case_h_sum` int NOT NULL DEFAULT 0,
	`net_case` int NOT NULL DEFAULT 0,
	`net_case_sum` int NOT NULL DEFAULT 0,
	`net_case_assigned` int NOT NULL DEFAULT 0,
	`net_case_assigned_sum` int NOT NULL DEFAULT 0,
	`amm` int NOT NULL DEFAULT 0,
	`amm_sum` int NOT NULL DEFAULT 0,
	`amm_assigned` int NOT NULL DEFAULT 0,
	`amm_assigned_sum` int NOT NULL DEFAULT 0,
	`fyc_sum` int NOT NULL DEFAULT 0,
	`fyc_assigned_sum` int NOT NULL DEFAULT 0,
	`ryc_sum` int NOT NULL DEFAULT 0,
	`ryc_assigned_sum` int NOT NULL DEFAULT 0,
	`renewal_rate` int NOT NULL DEFAULT 0,
	`renewal_rate_team` int NOT NULL DEFAULT 0,
	`is_mdrt` int NOT NULL DEFAULT 0,
	`is_qualified` int NOT NULL DEFAULT 0,
	`is_qualified_assigned` int NOT NULL DEFAULT 0,
	`is_qualified_next_month` int,
	`qualified_gap` int,
	`qualified_gap_next_month` int,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `agent_performance_monthly_id` PRIMARY KEY(`id`),
	CONSTRAINT `apm_period_udx` UNIQUE(`agent_code`,`year`,`month`)
);
--> statement-breakpoint
CREATE TABLE `performance_domain_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`aggregate_type` varchar(50) NOT NULL,
	`aggregate_id` varchar(50) NOT NULL,
	`event_type` varchar(100) NOT NULL,
	`payload` json NOT NULL,
	`occurred_at` datetime NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `performance_domain_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `point_agent_balances` (
	`agent_id` int NOT NULL,
	`current_points` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `point_agent_balances_agent_id` PRIMARY KEY(`agent_id`)
);
--> statement-breakpoint
CREATE TABLE `point_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`point_amount` int,
	`annual_limit` int,
	`standard` json,
	`created_by` int NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `point_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `point_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_id` int NOT NULL,
	`point_item_id` int NOT NULL,
	`points` int NOT NULL,
	`occurred_year` int NOT NULL,
	`source_type` varchar(100),
	`source_ref` varchar(100),
	`remark` text,
	`created_by` int NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `point_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `point_records_source_udx` UNIQUE(`source_type`,`source_ref`)
);
--> statement-breakpoint
CREATE TABLE `point_redemption_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`redeem_category` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`notice` text,
	`status` enum('draft','published','off_shelf') NOT NULL DEFAULT 'draft',
	`image_url` varchar(500),
	`stock` int NOT NULL DEFAULT 0,
	`redeem_points` int NOT NULL,
	`max_redeem_per_agent` int NOT NULL DEFAULT 1,
	`valid_period_months` int,
	`published_at` datetime,
	`off_shelf_at` datetime,
	`created_by` int NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `point_redemption_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `point_redemption_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`agent_id` int NOT NULL,
	`points_cost` int NOT NULL,
	`status` enum('success','cancelled') NOT NULL DEFAULT 'success',
	`remark` text,
	`redeemed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `point_redemption_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plan_completed_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollment_id` int NOT NULL,
	`task_id` int NOT NULL,
	`completion_mode` enum('checkin','metric') NOT NULL,
	`completed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`evidence_json` json,
	`remark` text,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `plan_completed_tasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `plan_completed_tasks_enrollment_task_udx` UNIQUE(`enrollment_id`,`task_id`)
);
--> statement-breakpoint
CREATE TABLE `plan_domain_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`aggregate_type` varchar(50) NOT NULL,
	`aggregate_id` int NOT NULL,
	`event_type` varchar(100) NOT NULL,
	`payload` json NOT NULL,
	`occurred_at` datetime NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `plan_domain_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plan_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plan_id` int NOT NULL,
	`agent_id` int NOT NULL,
	`status` enum('active','eligible','graduated','cancelled') NOT NULL DEFAULT 'active',
	`assigned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`started_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`eligible_at` datetime,
	`graduated_at` datetime,
	`cancelled_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `plan_enrollments_id` PRIMARY KEY(`id`),
	CONSTRAINT `plan_enrollments_plan_agent_udx` UNIQUE(`plan_id`,`agent_id`)
);
--> statement-breakpoint
CREATE TABLE `plan_stages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plan_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`display_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `plan_stages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plan_task_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`display_order` int NOT NULL DEFAULT 0,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `plan_task_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `plan_task_categories_name_udx` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `plan_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plan_id` int NOT NULL,
	`stage_id` int NOT NULL,
	`category_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`display_order` int NOT NULL DEFAULT 0,
	`task_type` enum('normal','metric') NOT NULL DEFAULT 'normal',
	`is_required` int NOT NULL DEFAULT 0,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`point_item_id` int,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `plan_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`created_by` int NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `plans_name_udx` UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `admin_account` ADD CONSTRAINT `admin_account_user_id_admin_id_fk` FOREIGN KEY (`user_id`) REFERENCES `admin`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admin_session` ADD CONSTRAINT `admin_session_user_id_admin_id_fk` FOREIGN KEY (`user_id`) REFERENCES `admin`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_hierarchy` ADD CONSTRAINT `agent_hierarchy_agent_code_fk` FOREIGN KEY (`agent_code`) REFERENCES `agents`(`agent_code`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_hierarchy` ADD CONSTRAINT `agent_hierarchy_leader_code_fk` FOREIGN KEY (`leader_code`) REFERENCES `agents`(`agent_code`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_logs` ADD CONSTRAINT `agent_logs_agent_code_fk` FOREIGN KEY (`agent_code`) REFERENCES `agents`(`agent_code`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agents` ADD CONSTRAINT `agents_leader_code_fk` FOREIGN KEY (`leader_code`) REFERENCES `agents`(`agent_code`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cms_contents` ADD CONSTRAINT `cms_contents_category_id_cms_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `cms_categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `crm_customer_profile_values` ADD CONSTRAINT `crm_profile_values_customer_fk` FOREIGN KEY (`customer_id`) REFERENCES `crm_customers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `crm_customer_profile_values` ADD CONSTRAINT `crm_profile_values_type_fk` FOREIGN KEY (`customer_type_id`) REFERENCES `crm_customer_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `crm_customer_profile_values` ADD CONSTRAINT `crm_profile_values_field_fk` FOREIGN KEY (`field_id`) REFERENCES `crm_profile_fields`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `crm_customers` ADD CONSTRAINT `crm_customers_customer_type_fk` FOREIGN KEY (`customer_type_id`) REFERENCES `crm_customer_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `crm_follow_up_records` ADD CONSTRAINT `crm_follow_up_records_customer_fk` FOREIGN KEY (`customer_id`) REFERENCES `crm_customers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `crm_follow_up_records` ADD CONSTRAINT `crm_follow_up_records_status_fk` FOREIGN KEY (`status_id`) REFERENCES `crm_follow_up_statuses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `crm_follow_up_statuses` ADD CONSTRAINT `crm_follow_up_statuses_customer_type_fk` FOREIGN KEY (`customer_type_id`) REFERENCES `crm_customer_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `crm_profile_fields` ADD CONSTRAINT `crm_profile_fields_customer_type_fk` FOREIGN KEY (`customer_type_id`) REFERENCES `crm_customer_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_performance_monthly` ADD CONSTRAINT `apm_agent_code_fk` FOREIGN KEY (`agent_code`) REFERENCES `agents`(`agent_code`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `point_records` ADD CONSTRAINT `point_records_point_item_id_point_items_id_fk` FOREIGN KEY (`point_item_id`) REFERENCES `point_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `point_redemption_records` ADD CONSTRAINT `point_redemption_records_product_fk` FOREIGN KEY (`product_id`) REFERENCES `point_redemption_products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plan_completed_tasks` ADD CONSTRAINT `plan_completed_tasks_enrollment_id_plan_enrollments_id_fk` FOREIGN KEY (`enrollment_id`) REFERENCES `plan_enrollments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plan_completed_tasks` ADD CONSTRAINT `plan_completed_tasks_task_id_plan_tasks_id_fk` FOREIGN KEY (`task_id`) REFERENCES `plan_tasks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plan_enrollments` ADD CONSTRAINT `plan_enrollments_plan_id_plans_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plan_stages` ADD CONSTRAINT `plan_stages_plan_id_plans_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plan_tasks` ADD CONSTRAINT `plan_tasks_plan_id_plans_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plan_tasks` ADD CONSTRAINT `plan_tasks_stage_id_plan_stages_id_fk` FOREIGN KEY (`stage_id`) REFERENCES `plan_stages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plan_tasks` ADD CONSTRAINT `plan_tasks_category_id_plan_task_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `plan_task_categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `admin_account_user_id_idx` ON `admin_account` (`user_id`);--> statement-breakpoint
CREATE INDEX `admin_account_provider_id_idx` ON `admin_account` (`provider_id`,`account_id`);--> statement-breakpoint
CREATE INDEX `admin_session_user_id_idx` ON `admin_session` (`user_id`);--> statement-breakpoint
CREATE INDEX `admin_session_token_idx` ON `admin_session` (`token`);--> statement-breakpoint
CREATE INDEX `admin_verification_identifier_idx` ON `admin_verification` (`identifier`);--> statement-breakpoint
CREATE INDEX `agent_domain_events_aggregate_idx` ON `agent_domain_events` (`aggregate_type`,`aggregate_id`);--> statement-breakpoint
CREATE INDEX `agent_domain_events_occurred_idx` ON `agent_domain_events` (`occurred_at`);--> statement-breakpoint
CREATE INDEX `agent_logs_agent_created_idx` ON `agent_logs` (`agent_code`,`created_at`);--> statement-breakpoint
CREATE INDEX `crm_profile_values_customer_type_idx` ON `crm_customer_profile_values` (`customer_id`,`customer_type_id`);--> statement-breakpoint
CREATE INDEX `crm_profile_values_agent_field_idx` ON `crm_customer_profile_values` (`agent_id`,`field_id`);--> statement-breakpoint
CREATE INDEX `crm_customer_types_enabled_order_idx` ON `crm_customer_types` (`enabled`,`sort_order`);--> statement-breakpoint
CREATE INDEX `crm_customers_agent_archive_follow_idx` ON `crm_customers` (`agent_id`,`archived_at`,`last_followed_at`);--> statement-breakpoint
CREATE INDEX `crm_customers_agent_type_phone_idx` ON `crm_customers` (`agent_id`,`customer_type_id`,`phone`);--> statement-breakpoint
CREATE INDEX `crm_customers_agent_type_wechat_idx` ON `crm_customers` (`agent_id`,`customer_type_id`,`wechat`);--> statement-breakpoint
CREATE INDEX `crm_follow_up_records_customer_time_idx` ON `crm_follow_up_records` (`customer_id`,`followed_at`);--> statement-breakpoint
CREATE INDEX `crm_follow_up_records_agent_time_idx` ON `crm_follow_up_records` (`agent_id`,`followed_at`);--> statement-breakpoint
CREATE INDEX `crm_follow_up_statuses_type_order_idx` ON `crm_follow_up_statuses` (`customer_type_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `crm_profile_fields_type_order_idx` ON `crm_profile_fields` (`customer_type_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `apm_period_idx` ON `agent_performance_monthly` (`year`,`month`);--> statement-breakpoint
CREATE INDEX `apm_agent_year_idx` ON `agent_performance_monthly` (`agent_code`,`year`);--> statement-breakpoint
CREATE INDEX `performance_domain_events_aggregate_idx` ON `performance_domain_events` (`aggregate_type`,`aggregate_id`);--> statement-breakpoint
CREATE INDEX `performance_domain_events_occurred_idx` ON `performance_domain_events` (`occurred_at`);--> statement-breakpoint
CREATE INDEX `point_agent_balances_points_idx` ON `point_agent_balances` (`current_points`);--> statement-breakpoint
CREATE INDEX `point_items_category_idx` ON `point_items` (`category`);--> statement-breakpoint
CREATE INDEX `point_records_agent_created_idx` ON `point_records` (`agent_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `point_records_limit_check_idx` ON `point_records` (`agent_id`,`point_item_id`,`occurred_year`);--> statement-breakpoint
CREATE INDEX `point_redemption_products_status_idx` ON `point_redemption_products` (`status`);--> statement-breakpoint
CREATE INDEX `point_redemption_products_valid_period_idx` ON `point_redemption_products` (`valid_period_months`);--> statement-breakpoint
CREATE INDEX `point_redemption_records_agent_time_idx` ON `point_redemption_records` (`agent_id`,`redeemed_at`);--> statement-breakpoint
CREATE INDEX `point_redemption_records_agent_product_idx` ON `point_redemption_records` (`agent_id`,`product_id`);--> statement-breakpoint
CREATE INDEX `point_redemption_records_product_time_idx` ON `point_redemption_records` (`product_id`,`redeemed_at`);--> statement-breakpoint
CREATE INDEX `plan_completed_tasks_task_idx` ON `plan_completed_tasks` (`task_id`);--> statement-breakpoint
CREATE INDEX `plan_domain_events_aggregate_idx` ON `plan_domain_events` (`aggregate_type`,`aggregate_id`);--> statement-breakpoint
CREATE INDEX `plan_domain_events_type_idx` ON `plan_domain_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `plan_enrollments_plan_status_idx` ON `plan_enrollments` (`plan_id`,`status`);--> statement-breakpoint
CREATE INDEX `plan_enrollments_agent_status_idx` ON `plan_enrollments` (`agent_id`,`status`);--> statement-breakpoint
CREATE INDEX `plan_stages_plan_order_idx` ON `plan_stages` (`plan_id`,`display_order`);--> statement-breakpoint
CREATE INDEX `plan_task_categories_active_order_idx` ON `plan_task_categories` (`is_active`,`display_order`);--> statement-breakpoint
CREATE INDEX `plan_tasks_plan_stage_order_idx` ON `plan_tasks` (`plan_id`,`stage_id`,`display_order`);--> statement-breakpoint
CREATE INDEX `plan_tasks_category_idx` ON `plan_tasks` (`category_id`);--> statement-breakpoint
CREATE INDEX `plan_tasks_point_item_idx` ON `plan_tasks` (`point_item_id`);
