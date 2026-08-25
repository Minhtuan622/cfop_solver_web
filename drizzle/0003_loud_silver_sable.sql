CREATE TABLE `cfop_competition_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`accountId` int NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cfop_competition_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `cfop_competition_members_room_account_unique` UNIQUE(`roomId`,`accountId`)
);
--> statement-breakpoint
CREATE TABLE `cfop_competition_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roundId` int NOT NULL,
	`accountId` int NOT NULL,
	`elapsedMs` int NOT NULL,
	`inspectionMs` int NOT NULL DEFAULT 0,
	`penalty` enum('none','+2','DNF') NOT NULL DEFAULT 'none',
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cfop_competition_results_id` PRIMARY KEY(`id`),
	CONSTRAINT `cfop_competition_results_round_account_unique` UNIQUE(`roundId`,`accountId`)
);
--> statement-breakpoint
CREATE TABLE `cfop_competition_rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`name` varchar(80) NOT NULL,
	`hostAccountId` int NOT NULL,
	`status` enum('waiting','active','finished') NOT NULL DEFAULT 'waiting',
	`maxPlayers` int NOT NULL DEFAULT 8,
	`currentRound` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cfop_competition_rooms_id` PRIMARY KEY(`id`),
	CONSTRAINT `cfop_competition_rooms_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `cfop_competition_rounds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`sequence` int NOT NULL,
	`scramble` varchar(255) NOT NULL,
	`status` enum('active','finished') NOT NULL DEFAULT 'active',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `cfop_competition_rounds_id` PRIMARY KEY(`id`),
	CONSTRAINT `cfop_competition_rounds_room_sequence_unique` UNIQUE(`roomId`,`sequence`)
);
--> statement-breakpoint
ALTER TABLE `cfop_competition_members` ADD CONSTRAINT `cfop_competition_members_roomId_cfop_competition_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `cfop_competition_rooms`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cfop_competition_members` ADD CONSTRAINT `cfop_competition_members_accountId_cfop_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `cfop_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cfop_competition_results` ADD CONSTRAINT `cfop_competition_results_roundId_cfop_competition_rounds_id_fk` FOREIGN KEY (`roundId`) REFERENCES `cfop_competition_rounds`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cfop_competition_results` ADD CONSTRAINT `cfop_competition_results_accountId_cfop_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `cfop_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cfop_competition_rooms` ADD CONSTRAINT `cfop_competition_rooms_hostAccountId_cfop_accounts_id_fk` FOREIGN KEY (`hostAccountId`) REFERENCES `cfop_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cfop_competition_rounds` ADD CONSTRAINT `cfop_competition_rounds_roomId_cfop_competition_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `cfop_competition_rooms`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `cfop_competition_members_account_idx` ON `cfop_competition_members` (`accountId`);--> statement-breakpoint
CREATE INDEX `cfop_competition_results_account_idx` ON `cfop_competition_results` (`accountId`);--> statement-breakpoint
CREATE INDEX `cfop_competition_rooms_host_idx` ON `cfop_competition_rooms` (`hostAccountId`);--> statement-breakpoint
CREATE INDEX `cfop_competition_rounds_room_idx` ON `cfop_competition_rounds` (`roomId`);