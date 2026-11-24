CREATE TABLE `cfop_account_identities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`provider` varchar(16) NOT NULL,
	`providerSubject` varchar(191) NOT NULL,
	`email` varchar(320) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cfop_account_identities_id` PRIMARY KEY(`id`),
	CONSTRAINT `cfop_account_identities_provider_subject_unique` UNIQUE(`provider`,`providerSubject`)
);
--> statement-breakpoint
ALTER TABLE `cfop_account_identities` ADD CONSTRAINT `cfop_account_identities_accountId_cfop_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `cfop_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `cfop_account_identities_account_idx` ON `cfop_account_identities` (`accountId`);