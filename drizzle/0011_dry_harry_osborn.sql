CREATE TABLE `cfop_competition_moderation_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`actorAccountId` int NOT NULL,
	`targetAccountId` int NOT NULL,
	`action` enum('remove_spectator') NOT NULL DEFAULT 'remove_spectator',
	`reason` varchar(280) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cfop_competition_moderation_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cfop_competition_moderation_logs` ADD CONSTRAINT `ccml_room_fk` FOREIGN KEY (`roomId`) REFERENCES `cfop_competition_rooms`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cfop_competition_moderation_logs` ADD CONSTRAINT `ccml_actor_fk` FOREIGN KEY (`actorAccountId`) REFERENCES `cfop_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cfop_competition_moderation_logs` ADD CONSTRAINT `ccml_target_fk` FOREIGN KEY (`targetAccountId`) REFERENCES `cfop_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `cfop_competition_moderation_room_created_idx` ON `cfop_competition_moderation_logs` (`roomId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `cfop_competition_moderation_target_idx` ON `cfop_competition_moderation_logs` (`targetAccountId`);
