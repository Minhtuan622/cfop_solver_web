CREATE TABLE `cfop_push_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`endpoint` varchar(512) NOT NULL,
	`p256dh` varchar(160) NOT NULL,
	`auth` varchar(64) NOT NULL,
	`tzOffsetMinutes` int NOT NULL DEFAULT 0,
	`nextDueAt` bigint,
	`dueCount` int NOT NULL DEFAULT 0,
	`lastNotifiedAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cfop_push_subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `cfop_push_subscriptions_endpoint_idx` UNIQUE(`endpoint`)
);
--> statement-breakpoint
ALTER TABLE `cfop_push_subscriptions` ADD CONSTRAINT `cfop_push_subscriptions_accountId_cfop_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `cfop_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `cfop_push_subscriptions_account_idx` ON `cfop_push_subscriptions` (`accountId`);--> statement-breakpoint
CREATE INDEX `cfop_push_subscriptions_due_idx` ON `cfop_push_subscriptions` (`nextDueAt`);