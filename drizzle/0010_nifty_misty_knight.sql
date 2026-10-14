CREATE TABLE `liveUserEarnings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`minuteIndex` int NOT NULL,
	`activeUsersCount` int NOT NULL,
	`earningPerActiveUser` decimal(10,6) NOT NULL DEFAULT '0.001',
	`totalEarning` decimal(10,4) NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `liveUserEarnings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `liveUserSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`deviceId` varchar(255),
	`appVersion` varchar(50),
	`osType` varchar(50),
	`country` varchar(100),
	`startTime` timestamp NOT NULL DEFAULT (now()),
	`endTime` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`durationSeconds` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `liveUserSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `liveUserSessions_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `liveUserStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`hour` int NOT NULL,
	`totalActiveSessions` int NOT NULL,
	`peakActiveUsers` int NOT NULL,
	`averageActiveUsers` decimal(10,2) NOT NULL,
	`totalEarningsFromLiveUsers` decimal(10,4) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `liveUserStats_id` PRIMARY KEY(`id`)
);
