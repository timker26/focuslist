CREATE TABLE `family_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`family_id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`role` enum('owner','member') NOT NULL DEFAULT 'member',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `family_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `family_spaces` (
	`id` varchar(36) NOT NULL,
	`title` varchar(120) NOT NULL,
	`owner_id` int NOT NULL,
	`invite_code` varchar(16) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `family_spaces_id` PRIMARY KEY(`id`),
	CONSTRAINT `family_spaces_invite_code_unique` UNIQUE(`invite_code`)
);
--> statement-breakpoint
CREATE TABLE `family_sync_documents` (
	`family_id` varchar(36) NOT NULL,
	`payload` text NOT NULL,
	`revision` int NOT NULL DEFAULT 0,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `family_sync_documents_family_id` PRIMARY KEY(`family_id`)
);
--> statement-breakpoint
CREATE TABLE `user_sync_documents` (
	`user_id` int NOT NULL,
	`payload` text NOT NULL,
	`revision` int NOT NULL DEFAULT 0,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_sync_documents_user_id` PRIMARY KEY(`user_id`)
);
