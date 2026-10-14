CREATE TABLE `adClicks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`adId` int NOT NULL,
	`rewardEarned` int NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`referrer` varchar(512),
	`isValid` boolean NOT NULL DEFAULT true,
	`clickedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adClicks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `advertisements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`advertiserName` varchar(255) NOT NULL,
	`advertiserUrl` varchar(512) NOT NULL,
	`imageUrl` varchar(512),
	`rewardAmount` int NOT NULL DEFAULT 10000,
	`rewardType` enum('digital_currency','points','cash') NOT NULL DEFAULT 'digital_currency',
	`status` enum('active','paused','ended') NOT NULL DEFAULT 'active',
	`dailyBudget` varchar(20),
	`totalBudget` varchar(20),
	`spentAmount` varchar(20) NOT NULL DEFAULT '0',
	`maxClicks` int,
	`currentClicks` int NOT NULL DEFAULT 0,
	`startDate` timestamp,
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `advertisements_id` PRIMARY KEY(`id`)
);
