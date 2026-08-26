CREATE TABLE `cfop_wca_oauth_states` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`stateHash` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cfop_wca_oauth_states_id` PRIMARY KEY(`id`),
	CONSTRAINT `cfop_wca_oauth_states_stateHash_unique` UNIQUE(`stateHash`)
);
--> statement-breakpoint
ALTER TABLE `cfop_accounts` ADD `wcaId` varchar(10);--> statement-breakpoint
ALTER TABLE `cfop_accounts` ADD CONSTRAINT `cfop_accounts_wcaId_unique` UNIQUE(`wcaId`);--> statement-breakpoint
ALTER TABLE `cfop_wca_oauth_states` ADD CONSTRAINT `cfop_wca_oauth_states_accountId_cfop_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `cfop_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `cfop_wca_oauth_account_idx` ON `cfop_wca_oauth_states` (`accountId`);--> statement-breakpoint
CREATE INDEX `cfop_wca_oauth_expires_idx` ON `cfop_wca_oauth_states` (`expiresAt`);