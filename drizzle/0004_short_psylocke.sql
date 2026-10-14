CREATE TABLE `adViews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`surveyId` int NOT NULL,
	`adId` int NOT NULL,
	`viewDuration` int NOT NULL,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`rewardEarned` int NOT NULL DEFAULT 0,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adViews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surveyAds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`surveyId` int NOT NULL,
	`adId` int NOT NULL,
	`displayPosition` enum('before_survey','during_survey','after_survey') NOT NULL DEFAULT 'before_survey',
	`displayDuration` int NOT NULL DEFAULT 26,
	`isSkippable` boolean NOT NULL DEFAULT false,
	`rewardForViewing` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `surveyAds_id` PRIMARY KEY(`id`)
);
