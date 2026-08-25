CREATE TABLE `cfop_competition_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`accountId` int NOT NULL,
	`content` varchar(500) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cfop_competition_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cfop_competition_rooms` ADD `format` enum('best_of_3','ao5','ao12') DEFAULT 'ao5' NOT NULL;--> statement-breakpoint
ALTER TABLE `cfop_competition_messages` ADD CONSTRAINT `cfop_competition_messages_roomId_cfop_competition_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `cfop_competition_rooms`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cfop_competition_messages` ADD CONSTRAINT `cfop_competition_messages_accountId_cfop_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `cfop_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `cfop_competition_messages_room_created_idx` ON `cfop_competition_messages` (`roomId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `cfop_competition_messages_account_idx` ON `cfop_competition_messages` (`accountId`);