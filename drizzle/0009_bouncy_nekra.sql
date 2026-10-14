CREATE TABLE `appInstallations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`appPackageName` varchar(255) NOT NULL,
	`installationDate` timestamp NOT NULL DEFAULT (now()),
	`uninstallationDate` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`deviceId` varchar(255),
	`deviceModel` varchar(255),
	`osVersion` varchar(50),
	`country` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `appInstallations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `googlePlayEarnings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`appPackageName` varchar(255) NOT NULL,
	`downloads` int NOT NULL DEFAULT 0,
	`installations` int NOT NULL DEFAULT 0,
	`activeUsers` int NOT NULL DEFAULT 0,
	`earnings` decimal(10,4) NOT NULL DEFAULT '0',
	`commissionRate` decimal(5,2) NOT NULL DEFAULT '30',
	`netEarnings` decimal(10,4) NOT NULL DEFAULT '0',
	`period` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `googlePlayEarnings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `googlePlayStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`appPackageName` varchar(255) NOT NULL,
	`date` varchar(10) NOT NULL,
	`dailyDownloads` int NOT NULL DEFAULT 0,
	`dailyInstallations` int NOT NULL DEFAULT 0,
	`dailyUninstallations` int NOT NULL DEFAULT 0,
	`activeUsersDaily` int NOT NULL DEFAULT 0,
	`dailyEarnings` decimal(10,4) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `googlePlayStats_id` PRIMARY KEY(`id`)
);
