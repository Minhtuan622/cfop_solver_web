CREATE TABLE `cfop_account_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cfop_account_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `cfop_account_sessions_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `cfop_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`displayName` varchar(80) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cfop_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `cfop_accounts_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `cfop_account_sessions` ADD CONSTRAINT `cfop_account_sessions_accountId_cfop_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `cfop_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `cfop_account_sessions_account_idx` ON `cfop_account_sessions` (`accountId`);--> statement-breakpoint
CREATE INDEX `cfop_account_sessions_expires_idx` ON `cfop_account_sessions` (`expiresAt`);