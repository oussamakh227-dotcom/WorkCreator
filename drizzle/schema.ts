import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, uniqueIndex } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  paypalEmail: varchar("paypalEmail", { length: 320 }),
  googlePoints: varchar("googlePoints", { length: 64 }),
  totalPoints: int("totalPoints").default(0).notNull(),
  availableBalance: decimal("availableBalance", { precision: 10, scale: 2 }).default("0.00").notNull(),
  totalWithdrawn: decimal("totalWithdrawn", { precision: 10, scale: 2 }).default("0.00").notNull(),
  profileImage: varchar("profileImage", { length: 512 }),
  bio: text("bio"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const surveyCategories = mysqlTable("surveyCategories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 7 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SurveyCategory = typeof surveyCategories.$inferSelect;
export type InsertSurveyCategory = typeof surveyCategories.$inferInsert;

export const levelRequirements = mysqlTable("levelRequirements", {
  id: int("id").autoincrement().primaryKey(),
  level: int("level").notNull().unique(),
  requiredPoints: int("requiredPoints").notNull(),
  minSurveyTime: int("minSurveyTime").notNull(),
  maxSurveyTime: int("maxSurveyTime").notNull(),
  minPointsPerSurvey: int("minPointsPerSurvey").notNull(),
  maxPointsPerSurvey: int("maxPointsPerSurvey").notNull(),
  description: text("description"),
  badge: varchar("badge", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LevelRequirement = typeof levelRequirements.$inferSelect;
export type InsertLevelRequirement = typeof levelRequirements.$inferInsert;

export const userLevels = mysqlTable("userLevels", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  currentLevel: int("currentLevel").default(1).notNull(),
  pointsInLevel: int("pointsInLevel").default(0).notNull(),
  totalPointsEarned: int("totalPointsEarned").default(0).notNull(),
  levelUpAt: timestamp("levelUpAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserLevel = typeof userLevels.$inferSelect;
export type InsertUserLevel = typeof userLevels.$inferInsert;

export const surveys = mysqlTable("surveys", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  categoryId: int("categoryId").notNull(),
  levelRequired: int("levelRequired").default(1).notNull(),
  pointsReward: int("pointsReward").notNull(),
  estimatedTime: int("estimatedTime"),
  questions: text("questions"),
  status: mysqlEnum("status", ["draft", "active", "paused", "completed"]).default("draft").notNull(),
  targetAudience: text("targetAudience"),
  maxResponses: int("maxResponses"),
  currentResponses: int("currentResponses").default(0).notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = typeof surveys.$inferInsert;

export const surveyResponses = mysqlTable("surveyResponses", {
  id: int("id").autoincrement().primaryKey(),
  surveyId: int("surveyId").notNull(),
  userId: int("userId").notNull(),
  answers: text("answers"),
  pointsAwarded: int("pointsAwarded").notNull(),
  timeSpentSeconds: int("timeSpentSeconds"),
  isCompleted: boolean("isCompleted").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  userSurveyUnique: uniqueIndex("surveyResponses_user_survey_unique").on(table.userId, table.surveyId),
}));

export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertSurveyResponse = typeof surveyResponses.$inferInsert;

export const pointsLedger = mysqlTable("pointsLedger", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(),
  type: mysqlEnum("type", ["earned", "withdrawn", "refunded", "bonus"]).notNull(),
  surveyId: int("surveyId"),
  withdrawalId: int("withdrawalId"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PointsLedger = typeof pointsLedger.$inferSelect;
export type InsertPointsLedger = typeof pointsLedger.$inferInsert;

export const withdrawalRequests = mysqlTable("withdrawalRequests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  pointsRequested: int("pointsRequested").notNull(),
  amountRequested: varchar("amountRequested", { length: 20 }).notNull(),
  conversionRate: varchar("conversionRate", { length: 20 }).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["paypal", "bank_transfer", "stripe"]).notNull(),
  paymentDetails: text("paymentDetails"),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "completed", "failed"]).default("pending").notNull(),
  stripePaymentId: varchar("stripePaymentId", { length: 255 }),
  processedAt: timestamp("processedAt"),
  completedAt: timestamp("completedAt"),
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type InsertWithdrawalRequest = typeof withdrawalRequests.$inferInsert;

export const activityLog = mysqlTable("activityLog", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  description: text("description"),
  surveyId: int("surveyId"),
  withdrawalId: int("withdrawalId"),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = typeof activityLog.$inferInsert;

export const adminNotifications = mysqlTable("adminNotifications", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  type: mysqlEnum("type", ["new_user", "new_withdrawal", "survey_completed", "system"]).notNull(),
  userId: int("userId"),
  withdrawalId: int("withdrawalId"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = typeof adminNotifications.$inferInsert;

export const userAchievements = mysqlTable("userAchievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  level: int("level").notNull(),
  achievedAt: timestamp("achievedAt").defaultNow().notNull(),
});

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

export const analytics = mysqlTable("analytics", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull(),
  totalUsers: int("totalUsers").default(0).notNull(),
  newUsers: int("newUsers").default(0).notNull(),
  activeUsers: int("activeUsers").default(0).notNull(),
  totalSurveys: int("totalSurveys").default(0).notNull(),
  activeSurveys: int("activeSurveys").default(0).notNull(),
  completedResponses: int("completedResponses").default(0).notNull(),
  totalPointsDistributed: int("totalPointsDistributed").default(0).notNull(),
  totalMoneyDistributed: varchar("totalMoneyDistributed", { length: 20 }).default("0.00").notNull(),
  totalWithdrawalRequests: int("totalWithdrawalRequests").default(0).notNull(),
  approvedWithdrawals: int("approvedWithdrawals").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = typeof analytics.$inferInsert;

export const surveyAnalysis = mysqlTable("surveyAnalysis", {
  id: int("id").autoincrement().primaryKey(),
  surveyId: int("surveyId").notNull(),
  summary: text("summary"),
  insights: text("insights"),
  trends: text("trends"),
  recommendations: text("recommendations"),
  sentimentScore: varchar("sentimentScore", { length: 10 }),
  demographics: text("demographics"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SurveyAnalysis = typeof surveyAnalysis.$inferSelect;
export type InsertSurveyAnalysis = typeof surveyAnalysis.$inferInsert;

export const advertisements = mysqlTable("advertisements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  advertiserName: varchar("advertiserName", { length: 255 }).notNull(),
  advertiserUrl: varchar("advertiserUrl", { length: 512 }).notNull(),
  imageUrl: varchar("imageUrl", { length: 512 }),
  rewardAmount: int("rewardAmount").default(10000).notNull(),
  rewardType: mysqlEnum("rewardType", ["digital_currency", "points", "cash"]).default("digital_currency").notNull(),
  status: mysqlEnum("status", ["active", "paused", "ended"]).default("active").notNull(),
  dailyBudget: varchar("dailyBudget", { length: 20 }),
  totalBudget: varchar("totalBudget", { length: 20 }),
  spentAmount: varchar("spentAmount", { length: 20 }).default("0").notNull(),
  maxClicks: int("maxClicks"),
  currentClicks: int("currentClicks").default(0).notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Advertisement = typeof advertisements.$inferSelect;
export type InsertAdvertisement = typeof advertisements.$inferInsert;

export const adClicks = mysqlTable("adClicks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  adId: int("adId").notNull(),
  rewardEarned: int("rewardEarned").notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  referrer: varchar("referrer", { length: 512 }),
  isValid: boolean("isValid").default(true).notNull(),
  clickedAt: timestamp("clickedAt").defaultNow().notNull(),
});

export type AdClick = typeof adClicks.$inferSelect;
export type InsertAdClick = typeof adClicks.$inferInsert;

export const surveyAds = mysqlTable("surveyAds", {
  id: int("id").autoincrement().primaryKey(),
  surveyId: int("surveyId").notNull(),
  adId: int("adId").notNull(),
  displayPosition: mysqlEnum("displayPosition", ["before_survey", "during_survey", "after_survey"]).default("before_survey").notNull(),
  displayDuration: int("displayDuration").default(26).notNull(),
  isSkippable: boolean("isSkippable").default(false).notNull(),
  rewardForViewing: int("rewardForViewing").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SurveyAd = typeof surveyAds.$inferSelect;
export type InsertSurveyAd = typeof surveyAds.$inferInsert;

export const adViews = mysqlTable("adViews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  surveyId: int("surveyId").notNull(),
  adId: int("adId"),
  viewDuration: int("viewDuration").notNull(),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  rewardEarned: int("rewardEarned").default(0).notNull(),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
});

export type AdView = typeof adViews.$inferSelect;
export type InsertAdView = typeof adViews.$inferInsert;

export const adSchedules = mysqlTable("adSchedules", {
  id: int("id").autoincrement().primaryKey(),
  adId: int("adId").notNull(),
  scheduleType: mysqlEnum("scheduleType", ["once", "daily", "weekly", "monthly"]).default("once").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  startTime: varchar("startTime", { length: 5 }),
  endTime: varchar("endTime", { length: 5 }),
  daysOfWeek: varchar("daysOfWeek", { length: 50 }),
  timezone: varchar("timezone", { length: 50 }).default("UTC").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  priority: int("priority").default(0).notNull(),
  maxDailyBudget: varchar("maxDailyBudget", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdSchedule = typeof adSchedules.$inferSelect;
export type InsertAdSchedule = typeof adSchedules.$inferInsert;

export const adPerformanceByTime = mysqlTable("adPerformanceByTime", {
  id: int("id").autoincrement().primaryKey(),
  adId: int("adId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  hour: int("hour").notNull(),
  impressions: int("impressions").default(0).notNull(),
  clicks: int("clicks").default(0).notNull(),
  views: int("views").default(0).notNull(),
  completedViews: int("completedViews").default(0).notNull(),
  revenue: varchar("revenue", { length: 20 }).default("0").notNull(),
  ctr: varchar("ctr", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdPerformanceByTime = typeof adPerformanceByTime.$inferSelect;
export type InsertAdPerformanceByTime = typeof adPerformanceByTime.$inferInsert;

export const supportTickets = mysqlTable("supportTickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["technical", "billing", "complaint", "feature_request", "other"]).notNull(),
  message: text("message").notNull(),
  attachmentUrl: varchar("attachmentUrl", { length: 512 }),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  adminResponse: text("adminResponse"),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

export const siteSettings = mysqlTable("siteSettings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  description: text("description"),
  type: varchar("type", { length: 50 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;

export const ownerProfile = mysqlTable("ownerProfile", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  businessName: varchar("businessName", { length: 255 }),
  businessDescription: text("businessDescription"),
  logo: varchar("logo", { length: 512 }),
  website: varchar("website", { length: 512 }),
  supportEmail: varchar("supportEmail", { length: 320 }).notNull(),
  supportPhone: varchar("supportPhone", { length: 20 }),
  bankAccount: text("bankAccount"),
  taxId: varchar("taxId", { length: 50 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  timezone: varchar("timezone", { length: 50 }).default("UTC").notNull(),
  language: varchar("language", { length: 10 }).default("ar").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OwnerProfile = typeof ownerProfile.$inferSelect;
export type InsertOwnerProfile = typeof ownerProfile.$inferInsert;

export const referralLinks = mysqlTable("referralLinks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  referralCode: varchar("referralCode", { length: 20 }).notNull().unique(),
  referralUrl: varchar("referralUrl", { length: 512 }).notNull(),
  totalInvites: int("totalInvites").default(0).notNull(),
  successfulInvites: int("successfulInvites").default(0).notNull(),
  totalRewardsEarned: varchar("totalRewardsEarned", { length: 20 }).default("0").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReferralLink = typeof referralLinks.$inferSelect;
export type InsertReferralLink = typeof referralLinks.$inferInsert;

export const referralRewards = mysqlTable("referralRewards", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),
  referredUserId: int("referredUserId").notNull(),
  rewardAmount: varchar("rewardAmount", { length: 20 }).default("0.10").notNull(),
  rewardInDigitalCurrency: int("rewardInDigitalCurrency").default(100000).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  referredUserUnique: uniqueIndex("referralRewards_referred_user_unique").on(table.referredUserId),
}));

export type ReferralReward = typeof referralRewards.$inferSelect;
export type InsertReferralReward = typeof referralRewards.$inferInsert;

export const referralStats = mysqlTable("referralStats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  invitesCount: int("invitesCount").default(0).notNull(),
  successfulCount: int("successfulCount").default(0).notNull(),
  rewardsEarned: varchar("rewardsEarned", { length: 20 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReferralStats = typeof referralStats.$inferSelect;
export type InsertReferralStats = typeof referralStats.$inferInsert;

export const surveyShares = mysqlTable("surveyShares", {
  id: int("id").autoincrement().primaryKey(),
  surveyId: int("surveyId").notNull(),
  sharedByUserId: int("sharedByUserId").notNull(),
  sharedWithUserId: int("sharedWithUserId").notNull(),
  shareCode: varchar("shareCode", { length: 50 }).notNull().unique(),
  isAccepted: boolean("isAccepted").default(false).notNull(),
  acceptedAt: timestamp("acceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SurveyShare = typeof surveyShares.$inferSelect;
export type InsertSurveyShare = typeof surveyShares.$inferInsert;

export const sharedEarnings = mysqlTable("sharedEarnings", {
  id: int("id").autoincrement().primaryKey(),
  surveyShareId: int("surveyShareId").notNull(),
  surveyId: int("surveyId").notNull(),
  sharedByUserId: int("sharedByUserId").notNull(),
  sharedWithUserId: int("sharedWithUserId").notNull(),
  totalEarnings: decimal("totalEarnings", { precision: 10, scale: 4 }).notNull(),
  sharedByEarnings: decimal("sharedByEarnings", { precision: 10, scale: 4 }).notNull(),
  sharedWithEarnings: decimal("sharedWithEarnings", { precision: 10, scale: 4 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed"]).default("pending").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SharedEarning = typeof sharedEarnings.$inferSelect;
export type InsertSharedEarning = typeof sharedEarnings.$inferInsert;

export const surveyEarningsLog = mysqlTable("surveyEarningsLog", {
  id: int("id").autoincrement().primaryKey(),
  surveyId: int("surveyId").notNull(),
  userId: int("userId").notNull(),
  earningAmount: decimal("earningAmount", { precision: 10, scale: 4 }).notNull(),
  durationMinutes: int("durationMinutes").notNull(),
  earningPerMinute: decimal("earningPerMinute", { precision: 10, scale: 4 }).default("0.01").notNull(),
  isShared: boolean("isShared").default(false).notNull(),
  sharedWithUserId: int("sharedWithUserId"),
  sharePercentage: int("sharePercentage").default(100).notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type SurveyEarningsLog = typeof surveyEarningsLog.$inferSelect;
export type InsertSurveyEarningsLog = typeof surveyEarningsLog.$inferInsert;

export const googlePlayEarnings = mysqlTable("googlePlayEarnings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  appPackageName: varchar("appPackageName", { length: 255 }).notNull(),
  downloads: int("downloads").default(0).notNull(),
  installations: int("installations").default(0).notNull(),
  activeUsers: int("activeUsers").default(0).notNull(),
  earnings: decimal("earnings", { precision: 10, scale: 4 }).default("0").notNull(),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).default("30").notNull(),
  netEarnings: decimal("netEarnings", { precision: 10, scale: 4 }).default("0").notNull(),
  period: varchar("period", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GooglePlayEarning = typeof googlePlayEarnings.$inferSelect;
export type InsertGooglePlayEarning = typeof googlePlayEarnings.$inferInsert;

export const appInstallations = mysqlTable("appInstallations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  appPackageName: varchar("appPackageName", { length: 255 }).notNull(),
  installationDate: timestamp("installationDate").defaultNow().notNull(),
  uninstallationDate: timestamp("uninstallationDate"),
  isActive: boolean("isActive").default(true).notNull(),
  deviceId: varchar("deviceId", { length: 255 }),
  deviceModel: varchar("deviceModel", { length: 255 }),
  osVersion: varchar("osVersion", { length: 50 }),
  country: varchar("country", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AppInstallation = typeof appInstallations.$inferSelect;
export type InsertAppInstallation = typeof appInstallations.$inferInsert;

export const googlePlayStats = mysqlTable("googlePlayStats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  appPackageName: varchar("appPackageName", { length: 255 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  dailyDownloads: int("dailyDownloads").default(0).notNull(),
  dailyInstallations: int("dailyInstallations").default(0).notNull(),
  dailyUninstallations: int("dailyUninstallations").default(0).notNull(),
  activeUsersDaily: int("activeUsersDaily").default(0).notNull(),
  dailyEarnings: decimal("dailyEarnings", { precision: 10, scale: 4 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GooglePlayStat = typeof googlePlayStats.$inferSelect;
export type InsertGooglePlayStat = typeof googlePlayStats.$inferInsert;

export const liveUserSessions = mysqlTable("liveUserSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionId: varchar("sessionId", { length: 255 }).notNull().unique(),
  deviceId: varchar("deviceId", { length: 255 }),
  appVersion: varchar("appVersion", { length: 50 }),
  osType: varchar("osType", { length: 50 }),
  country: varchar("country", { length: 100 }),
  startTime: timestamp("startTime").defaultNow().notNull(),
  endTime: timestamp("endTime"),
  isActive: boolean("isActive").default(true).notNull(),
  durationSeconds: int("durationSeconds").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LiveUserSession = typeof liveUserSessions.$inferSelect;
export type InsertLiveUserSession = typeof liveUserSessions.$inferInsert;

export const liveUserEarnings = mysqlTable("liveUserEarnings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionId: varchar("sessionId", { length: 255 }).notNull(),
  minuteIndex: int("minuteIndex").notNull(),
  activeUsersCount: int("activeUsersCount").notNull(),
  earningPerActiveUser: decimal("earningPerActiveUser", { precision: 10, scale: 6 }).default("0.001").notNull(),
  totalEarning: decimal("totalEarning", { precision: 10, scale: 4 }).notNull(),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export type LiveUserEarning = typeof liveUserEarnings.$inferSelect;
export type InsertLiveUserEarning = typeof liveUserEarnings.$inferInsert;

export const liveUserStats = mysqlTable("liveUserStats", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull(),
  hour: int("hour").notNull(),
  totalActiveSessions: int("totalActiveSessions").notNull(),
  peakActiveUsers: int("peakActiveUsers").notNull(),
  averageActiveUsers: decimal("averageActiveUsers", { precision: 10, scale: 2 }).notNull(),
  totalEarningsFromLiveUsers: decimal("totalEarningsFromLiveUsers", { precision: 10, scale: 4 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LiveUserStat = typeof liveUserStats.$inferSelect;
export type InsertLiveUserStat = typeof liveUserStats.$inferInsert;

// ============================================
// Social Lite Mode Tables
// ============================================

// Posts table
export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  content: text("content").notNull(),
  imageUrl: varchar("imageUrl", { length: 512 }),
  postType: mysqlEnum("postType", ["text", "image", "poll", "ad"]).default("text").notNull(),
  visibility: mysqlEnum("visibility", ["public", "private", "friends"]).default("public").notNull(),
  likesCount: int("likesCount").default(0).notNull(),
  commentsCount: int("commentsCount").default(0).notNull(),
  sharesCount: int("sharesCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Comments table
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull().references(() => posts.id),
  userId: int("userId").notNull().references(() => users.id),
  content: text("content").notNull(),
  likesCount: int("likesCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Likes table
export const likes = mysqlTable("likes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  postId: int("postId").references(() => posts.id),
  commentId: int("commentId").references(() => comments.id),
  likeType: mysqlEnum("likeType", ["post", "comment"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Follows table
export const follows = mysqlTable("follows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull().references(() => users.id),
  followingId: int("followingId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Shares table
export const shares = mysqlTable("shares", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull().references(() => posts.id),
  userId: int("userId").notNull().references(() => users.id),
  sharedVia: mysqlEnum("sharedVia", ["direct", "social", "link"]).default("direct").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Hashtags table
export const hashtags = mysqlTable("hashtags", {
  id: int("id").autoincrement().primaryKey(),
  tag: varchar("tag", { length: 100 }).notNull().unique(),
  usageCount: int("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Post Hashtags junction table
export const postHashtags = mysqlTable("postHashtags", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull().references(() => posts.id),
  hashtagId: int("hashtagId").notNull().references(() => hashtags.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Social Notifications table
export const socialNotifications = mysqlTable("socialNotifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  fromUserId: int("fromUserId").notNull().references(() => users.id),
  notificationType: mysqlEnum("notificationType", ["like", "comment", "follow", "share"]).notNull(),
  postId: int("postId").references(() => posts.id),
  commentId: int("commentId").references(() => comments.id),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// User Profile Enhanced table
export const userProfiles = mysqlTable("userProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  avatarUrl: varchar("avatarUrl", { length: 512 }),
  coverUrl: varchar("coverUrl", { length: 512 }),
  bio: text("bio"),
  website: varchar("website", { length: 255 }),
  location: varchar("location", { length: 255 }),
  followersCount: int("followersCount").default(0).notNull(),
  followingCount: int("followingCount").default(0).notNull(),
  postsCount: int("postsCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Export types
export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;
export type Like = typeof likes.$inferSelect;
export type InsertLike = typeof likes.$inferInsert;
export type Follow = typeof follows.$inferSelect;
export type InsertFollow = typeof follows.$inferInsert;
export type Share = typeof shares.$inferSelect;
export type InsertShare = typeof shares.$inferInsert;
export type Hashtag = typeof hashtags.$inferSelect;
export type InsertHashtag = typeof hashtags.$inferInsert;
export type SocialNotification = typeof socialNotifications.$inferSelect;
export type InsertSocialNotification = typeof socialNotifications.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;
