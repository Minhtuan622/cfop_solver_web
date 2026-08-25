CREATE TABLE `cfop_account_cloud_states` (
	`accountId` int NOT NULL,
	`payload` json NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cfop_account_cloud_states_accountId` PRIMARY KEY(`accountId`)
);
--> statement-breakpoint
CREATE TABLE `cfop_password_reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cfop_password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `cfop_password_reset_tokens_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
ALTER TABLE `cfop_accounts` ADD `bio` varchar(280) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `cfop_account_cloud_states` ADD CONSTRAINT `cfop_account_cloud_states_accountId_cfop_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `cfop_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cfop_password_reset_tokens` ADD CONSTRAINT `cfop_password_reset_tokens_accountId_cfop_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `cfop_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `cfop_password_reset_account_idx` ON `cfop_password_reset_tokens` (`accountId`);--> statement-breakpoint
CREATE INDEX `cfop_password_reset_expires_idx` ON `cfop_password_reset_tokens` (`expiresAt`);