CREATE TABLE `levelRequirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`level` int NOT NULL,
	`requiredPoints` int NOT NULL,
	`minSurveyTime` int NOT NULL,
	`maxSurveyTime` int NOT NULL,
	`minPointsPerSurvey` int NOT NULL,
	`maxPointsPerSurvey` int NOT NULL,
	`description` text,
	`badge` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `levelRequirements_id` PRIMARY KEY(`id`),
	CONSTRAINT `levelRequirements_level_unique` UNIQUE(`level`)
);
--> statement-breakpoint
CREATE TABLE `userAchievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`level` int NOT NULL,
	`achievedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userAchievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userLevels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentLevel` int NOT NULL DEFAULT 1,
	`pointsInLevel` int NOT NULL DEFAULT 0,
	`totalPointsEarned` int NOT NULL DEFAULT 0,
	`levelUpAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userLevels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `analytics` MODIFY COLUMN `totalMoneyDistributed` varchar(20) NOT NULL DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `surveyAnalysis` MODIFY COLUMN `sentimentScore` varchar(10);--> statement-breakpoint
ALTER TABLE `withdrawalRequests` MODIFY COLUMN `amountRequested` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `withdrawalRequests` MODIFY COLUMN `conversionRate` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `surveyResponses` ADD `timeSpentSeconds` int;--> statement-breakpoint
ALTER TABLE `surveys` ADD `levelRequired` int DEFAULT 1 NOT NULL;