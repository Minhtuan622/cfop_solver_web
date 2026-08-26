ALTER TABLE `cfop_competition_results` ADD `multiBlindAttempted` int;--> statement-breakpoint
ALTER TABLE `cfop_competition_results` ADD `multiBlindSolved` int;--> statement-breakpoint
ALTER TABLE `cfop_competition_results` ADD `multiBlindScore` int;--> statement-breakpoint
ALTER TABLE `cfop_competition_rooms` ADD `multiBlindCubes` int DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE `cfop_competition_rounds` ADD `scrambleBundle` json;