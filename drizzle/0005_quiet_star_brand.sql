CREATE TABLE `adPerformanceByTime` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`hour` int NOT NULL,
	`impressions` int NOT NULL DEFAULT 0,
	`clicks` int NOT NULL DEFAULT 0,
	`views` int NOT NULL DEFAULT 0,
	`completedViews` int NOT NULL DEFAULT 0,
	`revenue` varchar(20) NOT NULL DEFAULT '0',
	`ctr` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adPerformanceByTime_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `adSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adId` int NOT NULL,
	`scheduleType` enum('once','daily','weekly','monthly') NOT NULL DEFAULT 'once',
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`startTime` varchar(5),
	`endTime` varchar(5),
	`daysOfWeek` varchar(50),
	`timezone` varchar(50) NOT NULL DEFAULT 'UTC',
	`isActive` boolean NOT NULL DEFAULT true,
	`priority` int NOT NULL DEFAULT 0,
	`maxDailyBudget` varchar(20),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adSchedules_id` PRIMARY KEY(`id`)
);
