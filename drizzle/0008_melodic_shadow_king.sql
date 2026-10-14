CREATE TABLE `sharedEarnings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`surveyShareId` int NOT NULL,
	`surveyId` int NOT NULL,
	`sharedByUserId` int NOT NULL,
	`sharedWithUserId` int NOT NULL,
	`totalEarnings` decimal(10,4) NOT NULL,
	`sharedByEarnings` decimal(10,4) NOT NULL,
	`sharedWithEarnings` decimal(10,4) NOT NULL,
	`status` enum('pending','completed') NOT NULL DEFAULT 'pending',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sharedEarnings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surveyEarningsLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`surveyId` int NOT NULL,
	`userId` int NOT NULL,
	`earningAmount` decimal(10,4) NOT NULL,
	`durationMinutes` int NOT NULL,
	`earningPerMinute` decimal(10,4) NOT NULL DEFAULT '0.01',
	`isShared` boolean NOT NULL DEFAULT false,
	`sharedWithUserId` int,
	`sharePercentage` int NOT NULL DEFAULT 100,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `surveyEarningsLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surveyShares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`surveyId` int NOT NULL,
	`sharedByUserId` int NOT NULL,
	`sharedWithUserId` int NOT NULL,
	`shareCode` varchar(50) NOT NULL,
	`isAccepted` boolean NOT NULL DEFAULT false,
	`acceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `surveyShares_id` PRIMARY KEY(`id`),
	CONSTRAINT `surveyShares_shareCode_unique` UNIQUE(`shareCode`)
);
