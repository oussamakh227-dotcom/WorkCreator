import { eq, and, desc, gte, lte, or, lt, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { randomBytes } from "node:crypto";
import {
  InsertUser,
  users,
  surveys,
  surveyResponses,
  pointsLedger,
  withdrawalRequests,
  activityLog,
  adminNotifications,
  surveyCategories,
  surveyAnalysis,
  analytics,
  userLevels,
  userAchievements,
  levelRequirements,
  advertisements,
  adClicks,
  adSchedules,
  adPerformanceByTime,
  adViews,
  referralLinks,
  referralRewards,
  referralStats,
  surveyShares,
  sharedEarnings,
  surveyEarningsLog,
  liveUserSessions,
  liveUserEarnings,
  liveUserStats,
  googlePlayEarnings,
  appInstallations,
  googlePlayStats,
  socialNotifications,
  follows,
  posts,
  comments,
  likes,
} from "../drizzle/schema.ts";
import { ENV } from "./_core/env.ts";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER OPERATIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "phone", "loginMethod", "paypalEmail", "googlePoints", "profileImage", "bio"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByContact(email?: string, phone?: string) {
  const db = await getDb();
  if (!db || (!email && !phone)) return undefined;

  const conditions = [email ? eq(users.email, email) : undefined, phone ? eq(users.phone, phone) : undefined].filter(Boolean) as Array<ReturnType<typeof eq>>;
  const result = await db.select().from(users).where(or(...conditions)).limit(1);
  return result[0];
}

export async function updateUserProfile(userId: number, updates: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .update(users)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return result;
}

export async function getAllUsers(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(users).limit(limit).offset(offset);
}

// ============ SURVEY OPERATIONS ============

export async function createSurvey(survey: typeof surveys.$inferInsert) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(surveys).values(survey);
  return result;
}

export async function getSurveyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(surveys).where(eq(surveys.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getActiveSurveys(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(surveys)
    .where(eq(surveys.status, "active"))
    .orderBy(desc(surveys.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getSurveysByCategory(categoryId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(surveys)
    .where(and(eq(surveys.categoryId, categoryId), eq(surveys.status, "active")))
    .orderBy(desc(surveys.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function updateSurvey(id: number, updates: Partial<typeof surveys.$inferInsert>) {
  const db = await getDb();
  if (!db) return undefined;

  return await db
    .update(surveys)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(surveys.id, id));
}

export async function getAllSurveysAdmin(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(surveys).orderBy(desc(surveys.updatedAt)).limit(limit).offset(offset);
}

// ============ SURVEY RESPONSE OPERATIONS ============

export async function createSurveyResponse(response: typeof surveyResponses.$inferInsert) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.insert(surveyResponses).values(response);
}

export async function getUserSurveyResponses(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(surveyResponses)
    .where(eq(surveyResponses.userId, userId))
    .orderBy(desc(surveyResponses.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getCompletedSurveyIds(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({ surveyId: surveyResponses.surveyId })
    .from(surveyResponses)
    .where(and(eq(surveyResponses.userId, userId), eq(surveyResponses.isCompleted, true)));

  return result.map((response) => response.surveyId);
}

export async function incrementSurveyResponses(surveyId: number) {
  const db = await getDb();
  if (!db) return undefined;

  return await db
    .update(surveys)
    .set({ currentResponses: sql`${surveys.currentResponses} + 1` })
    .where(eq(surveys.id, surveyId));
}

export async function checkUserSurveyResponse(userId: number, surveyId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(surveyResponses)
    .where(and(eq(surveyResponses.userId, userId), eq(surveyResponses.surveyId, surveyId)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ POINTS OPERATIONS ============

export async function addPoints(userId: number, amount: number, type: string, description: string, surveyId?: number) {
  const db = await getDb();
  if (!db) return undefined;

  // Add to ledger
  await db.insert(pointsLedger).values({
    userId,
    amount,
    type: type as any,
    surveyId,
    description,
  });

  // Update user balance
  const user = await getUserById(userId);
  if (user) {
    const newTotal = user.totalPoints + amount;
    const newBalance = parseFloat(user.availableBalance.toString()) + amount * 0.1; // 1 point = $0.1

    await db
      .update(users)
      .set({
        totalPoints: newTotal,
        availableBalance: newBalance.toString(),
      })
      .where(eq(users.id, userId));

    const userLevel = await getUserLevel(userId);
    if (userLevel) {
      await db
        .update(userLevels)
        .set({
          pointsInLevel: userLevel.pointsInLevel + amount,
          totalPointsEarned: userLevel.totalPointsEarned + amount,
        })
        .where(eq(userLevels.userId, userId));
      await checkLevelUp(userId);
    } else {
      await db.insert(userLevels).values({
        userId,
        currentLevel: 1,
        pointsInLevel: amount,
        totalPointsEarned: amount,
      });
      await checkLevelUp(userId);
    }
  }
}

export async function getUserPointsHistory(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(pointsLedger)
    .where(eq(pointsLedger.userId, userId))
    .orderBy(desc(pointsLedger.createdAt))
    .limit(limit)
    .offset(offset);
}

// ============ WITHDRAWAL OPERATIONS ============

export async function createWithdrawalRequest(request: typeof withdrawalRequests.$inferInsert) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.insert(withdrawalRequests).values(request);
}

export async function getWithdrawalRequestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserWithdrawalRequests(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(withdrawalRequests)
    .where(eq(withdrawalRequests.userId, userId))
    .orderBy(desc(withdrawalRequests.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getAllWithdrawalRequests(status?: string, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  const query = status ? and(eq(withdrawalRequests.status, status as any)) : undefined;

  return await db
    .select()
    .from(withdrawalRequests)
    .where(query)
    .orderBy(desc(withdrawalRequests.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function updateWithdrawalRequest(id: number, updates: Partial<typeof withdrawalRequests.$inferInsert>) {
  const db = await getDb();
  if (!db) return undefined;

  return await db
    .update(withdrawalRequests)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(withdrawalRequests.id, id));
}

// ============ ACTIVITY LOG OPERATIONS ============

export async function logActivity(userId: number, action: string, description?: string, metadata?: any) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.insert(activityLog).values({
    userId,
    action,
    description,
    metadata: metadata ? JSON.stringify(metadata) : undefined,
  });
}

export async function getUserActivityLog(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(activityLog)
    .where(eq(activityLog.userId, userId))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getAdminOverview() {
  const db = await getDb();
  if (!db) {
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalSurveys: 0,
      activeSurveys: 0,
      totalResponses: 0,
      totalPointsDistributed: 0,
      pendingWithdrawals: 0,
      activeAdvertisements: 0,
      totalAdClicks: 0,
    };
  }

  const [totalUsers, activeUsers, totalSurveys, activeSurveys, totalResponses, points, pendingWithdrawals, activeAdvertisements, totalAdClicks] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(users),
    db.select({ count: sql<number>`COUNT(*)` }).from(users).where(eq(users.isActive, true)),
    db.select({ count: sql<number>`COUNT(*)` }).from(surveys),
    db.select({ count: sql<number>`COUNT(*)` }).from(surveys).where(eq(surveys.status, "active")),
    db.select({ count: sql<number>`COUNT(*)` }).from(surveyResponses),
    db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` }).from(pointsLedger),
    db.select({ count: sql<number>`COUNT(*)` }).from(withdrawalRequests).where(eq(withdrawalRequests.status, "pending")),
    db.select({ count: sql<number>`COUNT(*)` }).from(advertisements).where(eq(advertisements.status, "active")),
    db.select({ count: sql<number>`COUNT(*)` }).from(adClicks),
  ]);

  return {
    totalUsers: Number(totalUsers[0]?.count ?? 0),
    activeUsers: Number(activeUsers[0]?.count ?? 0),
    totalSurveys: Number(totalSurveys[0]?.count ?? 0),
    activeSurveys: Number(activeSurveys[0]?.count ?? 0),
    totalResponses: Number(totalResponses[0]?.count ?? 0),
    totalPointsDistributed: Number(points[0]?.total ?? 0),
    pendingWithdrawals: Number(pendingWithdrawals[0]?.count ?? 0),
    activeAdvertisements: Number(activeAdvertisements[0]?.count ?? 0),
    totalAdClicks: Number(totalAdClicks[0]?.count ?? 0),
  };
}

// ============ ADMIN NOTIFICATION OPERATIONS ============

export async function createAdminNotification(notification: typeof adminNotifications.$inferInsert) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.insert(adminNotifications).values(notification);
}

export async function getAdminNotifications(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(adminNotifications)
    .orderBy(desc(adminNotifications.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function markAdminNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.update(adminNotifications).set({ isRead: true }).where(eq(adminNotifications.id, id));
}

// ============ SURVEY CATEGORIES OPERATIONS ============

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(surveyCategories).orderBy(surveyCategories.name);
}

export async function createCategory(category: typeof surveyCategories.$inferInsert) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.insert(surveyCategories).values(category);
}

// ============ ANALYTICS OPERATIONS ============

export async function getAnalytics(date: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(analytics).where(eq(analytics.date, date)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateAnalytics(date: string, updates: Partial<typeof analytics.$inferInsert>) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.update(analytics).set(updates).where(eq(analytics.date, date));
}

// ============ SURVEY ANALYSIS OPERATIONS ============

export async function createSurveyAnalysis(analysis: typeof surveyAnalysis.$inferInsert) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.insert(surveyAnalysis).values(analysis);
}

export async function getSurveyAnalysis(surveyId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(surveyAnalysis).where(eq(surveyAnalysis.surveyId, surveyId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}


// ============ LEVEL OPERATIONS ============

export async function createLevelRequirements() {
  const db = await getDb();
  if (!db) return undefined;

  const levels = [
    {
      level: 1,
      requiredPoints: 0,
      minSurveyTime: 5,
      maxSurveyTime: 10,
      minPointsPerSurvey: 10,
      maxPointsPerSurvey: 20,
      description: "Beginner Level - Simple surveys",
      badge: "🌟",
    },
    {
      level: 2,
      requiredPoints: 100,
      minSurveyTime: 10,
      maxSurveyTime: 15,
      minPointsPerSurvey: 20,
      maxPointsPerSurvey: 40,
      description: "Intermediate Level - Standard surveys",
      badge: "⭐",
    },
    {
      level: 3,
      requiredPoints: 300,
      minSurveyTime: 15,
      maxSurveyTime: 20,
      minPointsPerSurvey: 40,
      maxPointsPerSurvey: 60,
      description: "Advanced Level - Detailed surveys",
      badge: "✨",
    },
    {
      level: 4,
      requiredPoints: 600,
      minSurveyTime: 20,
      maxSurveyTime: 25,
      minPointsPerSurvey: 60,
      maxPointsPerSurvey: 80,
      description: "Expert Level - Specialized surveys",
      badge: "💎",
    },
    {
      level: 5,
      requiredPoints: 1000,
      minSurveyTime: 7,
      maxSurveyTime: 20,
      minPointsPerSurvey: 80,
      maxPointsPerSurvey: 150,
      description: "Professional Level - Premium surveys",
      badge: "👑",
    },
  ];

  for (const level of levels) {
    await db.insert(levelRequirements).values(level);
  }
}

export async function getUserLevel(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(userLevels).where(eq(userLevels.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserLevel(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.insert(userLevels).values({
    userId,
    currentLevel: 1,
    pointsInLevel: 0,
    totalPointsEarned: 0,
  });
}

export async function getLevelRequirement(level: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(levelRequirements).where(eq(levelRequirements.level, level)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function checkLevelUp(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const userLevel = await getUserLevel(userId);
  if (!userLevel) return undefined;

  const nextLevelReq = await getLevelRequirement(userLevel.currentLevel + 1);
  if (!nextLevelReq) return undefined;

  if (userLevel.totalPointsEarned >= nextLevelReq.requiredPoints) {
    const newLevel = userLevel.currentLevel + 1;
    await db
      .update(userLevels)
      .set({
        currentLevel: newLevel,
        pointsInLevel: userLevel.totalPointsEarned - nextLevelReq.requiredPoints,
        levelUpAt: new Date(),
      })
      .where(eq(userLevels.userId, userId));

    // Create achievement record
    await db.insert(userAchievements).values({
      userId,
      level: newLevel,
    });

    return newLevel;
  }

  return undefined;
}

export async function getUserAchievements(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
}

export async function getSurveysByLevel(level: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(surveys)
    .where(and(eq(surveys.levelRequired, level), eq(surveys.status, "active")))
    .orderBy(desc(surveys.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getAvailableSurveysForUser(userId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  const userLevel = await getUserLevel(userId);
  const currentLevel = userLevel?.currentLevel ?? 1;

  return await db
    .select()
    .from(surveys)
    .where(
      and(
        eq(surveys.status, "active"),
        lte(surveys.levelRequired, currentLevel)
      )
    )
    .orderBy(desc(surveys.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getLevelRequirements() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(levelRequirements).orderBy(levelRequirements.level);
}


// ============ ADVERTISEMENT OPERATIONS ============

export async function createAdvertisement(ad: typeof advertisements.$inferInsert) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.insert(advertisements).values(ad);
}

export async function getActiveAdvertisements(limit = 10, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(advertisements)
    .where(eq(advertisements.status, "active"))
    .orderBy(desc(advertisements.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getAdvertisementById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(advertisements).where(eq(advertisements.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function recordAdClick(userId: number, adId: number, rewardAmount: number, ipAddress?: string, userAgent?: string) {
  const db = await getDb();
  if (!db) return undefined;

  // Record the click
  await db.insert(adClicks).values({
    userId,
    adId,
    rewardEarned: rewardAmount,
    ipAddress,
    userAgent,
    isValid: true,
  });

  // Add digital currency to user
  await addDigitalCurrency(userId, rewardAmount, "ad_click", `Earned from ad: ${adId}`);

  // Update ad click count
  const ad = await getAdvertisementById(adId);
  if (ad) {
    await db
      .update(advertisements)
      .set({
        currentClicks: ad.currentClicks + 1,
        spentAmount: (parseFloat(ad.spentAmount) + rewardAmount * 0.000001).toString(),
      })
      .where(eq(advertisements.id, adId));
  }

  return { success: true, rewardEarned: rewardAmount };
}

export async function getUserAdClicks(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(adClicks)
    .where(eq(adClicks.userId, userId))
    .orderBy(desc(adClicks.clickedAt))
    .limit(limit)
    .offset(offset);
}

export async function recordSurveyAdView(userId: number, surveyId: number, adId: number | null, viewDuration: number) {
  const db = await getDb();
  if (!db) return { recorded: false, alreadyRecorded: false };

  const existing = await db
    .select({ id: adViews.id })
    .from(adViews)
    .where(and(eq(adViews.userId, userId), eq(adViews.surveyId, surveyId), eq(adViews.isCompleted, true)))
    .limit(1);
  if (existing[0]) return { recorded: false, alreadyRecorded: true };

  await db.insert(adViews).values({
    userId,
    surveyId,
    adId,
    viewDuration,
    isCompleted: true,
    rewardEarned: 0,
  });
  return { recorded: true, alreadyRecorded: false };
}

// ============ DIGITAL CURRENCY OPERATIONS ============

export async function addDigitalCurrency(userId: number, amount: number, type: string, description?: string) {
  const db = await getDb();
  if (!db) return undefined;

  const user = await getUserById(userId);
  if (!user) return undefined;

  // Convert digital currency to USD (10000 digital currency = 0.01 USD)
  const usdAmount = (amount * 0.000001).toFixed(6);

  // Add to points ledger
  await db.insert(pointsLedger).values({
    userId,
    amount,
    type: "earned" as any,
    description: `${description} (Digital Currency)`,
  });

  // Update user balance
  const newBalance = (parseFloat(user.availableBalance.toString()) + parseFloat(usdAmount)).toFixed(2);
  await db
    .update(users)
    .set({
      totalPoints: user.totalPoints + amount,
      availableBalance: newBalance,
    })
    .where(eq(users.id, userId));

  return {
    digitalCurrency: amount,
    usdAmount: parseFloat(usdAmount),
  };
}

export async function getDigitalCurrencyBalance(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const user = await getUserById(userId);
  if (!user) return undefined;

  return {
    totalPoints: user.totalPoints,
    availableBalance: user.availableBalance,
    totalWithdrawn: user.totalWithdrawn,
  };
}

// ============ CONVERSION HELPER ============

export function convertDigitalCurrencyToUSD(digitalCurrency: number): number {
  // 10000 digital currency = 0.01 USD
  // 1 digital currency = 0.000001 USD
  return digitalCurrency * 0.000001;
}

export function convertUSDToDigitalCurrency(usd: number): number {
  // 0.01 USD = 10000 digital currency
  // 1 USD = 1000000 digital currency
  return usd * 1000000;
}


export async function updateAdvertisement(id: number, updates: Partial<typeof advertisements.$inferInsert>) {
  const db = await getDb();
  if (!db) return undefined;

  return await db
    .update(advertisements)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(advertisements.id, id));
}

export async function getAllAdvertisementsAdmin(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(advertisements).orderBy(desc(advertisements.updatedAt)).limit(limit).offset(offset);
}


// ============ AD SCHEDULING OPERATIONS ============

export async function createAdSchedule(schedule: typeof adSchedules.$inferInsert) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.insert(adSchedules).values(schedule);
}

export async function getAdSchedules(adId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(adSchedules).where(eq(adSchedules.adId, adId)).orderBy(desc(adSchedules.startDate));
}

export async function getAllAdSchedules(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(adSchedules).orderBy(desc(adSchedules.startDate)).limit(limit).offset(offset);
}

export async function getActiveAdSchedules(adId: number) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  return await db
    .select()
    .from(adSchedules)
    .where(
      and(
        eq(adSchedules.adId, adId),
        eq(adSchedules.isActive, true),
        lte(adSchedules.startDate, now)
      )
    );
}

export async function updateAdSchedule(id: number, updates: Partial<typeof adSchedules.$inferInsert>) {
  const db = await getDb();
  if (!db) return undefined;

  return await db
    .update(adSchedules)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(adSchedules.id, id));
}

export async function deleteAdSchedule(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.delete(adSchedules).where(eq(adSchedules.id, id));
}

export async function recordAdPerformance(
  adId: number,
  date: string,
  hour: number,
  impressions: number,
  clicks: number,
  views: number,
  completedViews: number,
  revenue: string
) {
  const db = await getDb();
  if (!db) return undefined;

  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : "0";

  return await db.insert(adPerformanceByTime).values({
    adId,
    date,
    hour,
    impressions,
    clicks,
    views,
    completedViews,
    revenue,
    ctr,
  });
}

export async function getAdPerformanceByTime(adId: number, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return [];

  if (startDate && endDate) {
    return await db
      .select()
      .from(adPerformanceByTime)
      .where(
        and(
          eq(adPerformanceByTime.adId, adId),
          gte(adPerformanceByTime.date, startDate),
          lte(adPerformanceByTime.date, endDate)
        )
      )
      .orderBy(desc(adPerformanceByTime.date), desc(adPerformanceByTime.hour));
  }

  return await db
    .select()
    .from(adPerformanceByTime)
    .where(eq(adPerformanceByTime.adId, adId))
    .orderBy(desc(adPerformanceByTime.date), desc(adPerformanceByTime.hour));
}

export async function getAdPerformanceSummary(adId: number, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return undefined;

  const performance = await getAdPerformanceByTime(adId, startDate, endDate);

  if (performance.length === 0) {
    return {
      totalImpressions: 0,
      totalClicks: 0,
      totalViews: 0,
      completedViews: 0,
      totalRevenue: "0",
      avgCTR: "0",
      bestHour: null,
      worstHour: null,
    };
  }

  const totalImpressions = performance.reduce((sum, p) => sum + p.impressions, 0);
  const totalClicks = performance.reduce((sum, p) => sum + p.clicks, 0);
  const totalViews = performance.reduce((sum, p) => sum + p.views, 0);
  const completedViews = performance.reduce((sum, p) => sum + p.completedViews, 0);
  const totalRevenue = performance.reduce((sum, p) => sum + parseFloat(p.revenue), 0).toFixed(2);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0";

  const bestHour = performance.reduce((best, current) =>
    current.clicks > (best?.clicks || 0) ? current : best
  );
  const worstHour = performance.reduce((worst, current) =>
    current.clicks < (worst?.clicks || Infinity) ? current : worst
  );

  return {
    totalImpressions,
    totalClicks,
    totalViews,
    completedViews,
    totalRevenue,
    avgCTR,
    bestHour: bestHour?.hour || null,
    worstHour: worstHour?.hour || null,
  };
}


// ============ REFERRAL OPERATIONS ============

export async function createReferralLink(userId: number, referralCode: string, referralUrl: string) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.insert(referralLinks).values({
    userId,
    referralCode,
    referralUrl,
  });
}

export async function getReferralLink(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(referralLinks).where(eq(referralLinks.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrCreateReferralLink(userId: number, baseUrl: string) {
  const existing = await getReferralLink(userId);
  if (existing) return existing;

  const referralCode = randomBytes(8).toString("hex").slice(0, 12);
  const referralUrl = `${baseUrl.replace(/\/$/, "")}/referral/${referralCode}`;
  await createReferralLink(userId, referralCode, referralUrl);
  return getReferralLink(userId);
}

export async function getReferralLinkByCode(referralCode: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(referralLinks).where(eq(referralLinks.referralCode, referralCode)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function recordReferral(referrerId: number, referredUserId: number) {
  const db = await getDb();
  if (!db) return undefined;
  if (referrerId === referredUserId) return { alreadyRecorded: false, rejected: true, reason: "self_referral" as const };

  const existing = await db
    .select({ id: referralRewards.id })
    .from(referralRewards)
    .where(eq(referralRewards.referredUserId, referredUserId))
    .limit(1);
  if (existing[0]) return { alreadyRecorded: true, rejected: false };

  const rewardAmount = "0.10";
  const rewardInDigitalCurrency = 100000;

  // Create referral reward record
  await db.insert(referralRewards).values({
    referrerId,
    referredUserId,
    rewardAmount,
    rewardInDigitalCurrency,
    status: "completed" as any,
    completedAt: new Date(),
  });

  // Update referral link stats
  const referralLink = await getReferralLink(referrerId);
  if (referralLink) {
    const newTotalRewards = (parseFloat(referralLink.totalRewardsEarned) + parseFloat(rewardAmount)).toFixed(2);
    await db
      .update(referralLinks)
      .set({
        successfulInvites: referralLink.successfulInvites + 1,
        totalRewardsEarned: newTotalRewards,
      })
      .where(eq(referralLinks.userId, referrerId));
  }

  // Award digital currency to referrer
  await addDigitalCurrency(referrerId, rewardInDigitalCurrency, "referral", `Referral reward for user ${referredUserId}`);

  return {
    alreadyRecorded: false,
    rejected: false,
    rewardAmount,
    rewardInDigitalCurrency,
  };
}

export async function getReferralStats(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const referralLink = await getReferralLink(userId);
  if (!referralLink) return undefined;

  const rewards = await db
    .select()
    .from(referralRewards)
    .where(and(eq(referralRewards.referrerId, userId), eq(referralRewards.status, "completed")));

  return {
    referralCode: referralLink.referralCode,
    referralUrl: referralLink.referralUrl,
    totalInvites: referralLink.totalInvites,
    successfulInvites: referralLink.successfulInvites,
    totalRewardsEarned: referralLink.totalRewardsEarned,
    recentRewards: rewards.slice(0, 10),
  };
}

export async function updateReferralInviteCount(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const referralLink = await getReferralLink(userId);
  if (!referralLink) return undefined;

  return await db
    .update(referralLinks)
    .set({
      totalInvites: referralLink.totalInvites + 1,
    })
    .where(eq(referralLinks.userId, userId));
}

export async function getReferralLeaderboard(limit = 10) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(referralLinks)
    .orderBy(desc(referralLinks.successfulInvites))
    .limit(limit);
}


// ============ SURVEY EARNINGS OPERATIONS ============

export async function calculateSurveyEarnings(durationMinutes: number, earningPerMinute = 0.01): Promise<string> {
  const earnings = (durationMinutes * earningPerMinute).toFixed(4);
  return earnings;
}

export async function recordSurveyEarning(
  surveyId: number,
  userId: number,
  durationMinutes: number,
  earningPerMinute = 0.01,
  isShared = false,
  sharedWithUserId?: number
) {
  const db = await getDb();
  if (!db) return undefined;

  const earningAmount = await calculateSurveyEarnings(durationMinutes, earningPerMinute);
  const sharePercentage = isShared ? 50 : 100;

  return await db.insert(surveyEarningsLog).values({
    surveyId,
    userId,
    earningAmount: earningAmount as any,
    durationMinutes,
    earningPerMinute: earningPerMinute.toString() as any,
    isShared,
    sharedWithUserId: sharedWithUserId || null,
    sharePercentage,
  });
}

export async function shareSurvey(surveyId: number, sharedByUserId: number, sharedWithUserId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const shareCode = `share_${surveyId}_${sharedByUserId}_${Date.now()}`;

  return await db.insert(surveyShares).values({
    surveyId,
    sharedByUserId,
    sharedWithUserId,
    shareCode,
  });
}

export async function acceptSurveyShare(shareCode: string) {
  const db = await getDb();
  if (!db) return undefined;

  return await db
    .update(surveyShares)
    .set({
      isAccepted: true,
      acceptedAt: new Date(),
    })
    .where(eq(surveyShares.shareCode, shareCode));
}

export async function recordSharedEarnings(
  surveyShareId: number,
  surveyId: number,
  sharedByUserId: number,
  sharedWithUserId: number,
  totalEarnings: string
) {
  const db = await getDb();
  if (!db) return undefined;

  const sharedByEarnings = (parseFloat(totalEarnings) * 0.5).toFixed(4);
  const sharedWithEarnings = (parseFloat(totalEarnings) * 0.5).toFixed(4);

  return await db.insert(sharedEarnings).values({
    surveyShareId,
    surveyId,
    sharedByUserId,
    sharedWithUserId,
    totalEarnings: totalEarnings as any,
    sharedByEarnings: sharedByEarnings as any,
    sharedWithEarnings: sharedWithEarnings as any,
    status: "completed" as any,
    completedAt: new Date(),
  });
}

export async function getUserSurveyEarnings(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];

  if (startDate && endDate) {
    return await db
      .select()
      .from(surveyEarningsLog)
      .where(
        and(
          eq(surveyEarningsLog.userId, userId),
          gte(surveyEarningsLog.completedAt, startDate),
          lte(surveyEarningsLog.completedAt, endDate)
        )
      )
      .orderBy(desc(surveyEarningsLog.completedAt));
  }

  return await db
    .select()
    .from(surveyEarningsLog)
    .where(eq(surveyEarningsLog.userId, userId))
    .orderBy(desc(surveyEarningsLog.completedAt));
}

export async function getUserSharedEarnings(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(sharedEarnings)
    .where(
      or(
        eq(sharedEarnings.sharedByUserId, userId),
        eq(sharedEarnings.sharedWithUserId, userId)
      )
    )
    .orderBy(desc(sharedEarnings.createdAt));
}

export async function getTotalEarnings(userId: number): Promise<{ total: string; shared: string; direct: string }> {
  const db = await getDb();
  if (!db) return { total: "0", shared: "0", direct: "0" };

  const earnings = await getUserSurveyEarnings(userId);
  const sharedEarningsList = await getUserSharedEarnings(userId);

  let directTotal = 0;
  let sharedTotal = 0;

  earnings.forEach((e) => {
    if (!e.isShared) {
      directTotal += parseFloat(e.earningAmount);
    }
  });

  sharedEarningsList.forEach((s) => {
    if (s.sharedByUserId === userId) {
      sharedTotal += parseFloat(s.sharedByEarnings);
    } else {
      sharedTotal += parseFloat(s.sharedWithEarnings);
    }
  });

  const total = (directTotal + sharedTotal).toFixed(4);

  return {
    total,
    shared: sharedTotal.toFixed(4),
    direct: directTotal.toFixed(4),
  };
}

export async function getSurveyEarningsStats(surveyId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const earnings = await db
    .select()
    .from(surveyEarningsLog)
    .where(eq(surveyEarningsLog.surveyId, surveyId));

  if (earnings.length === 0) {
    return {
      totalEarnings: "0",
      averageEarnings: "0",
      totalResponses: 0,
      sharedResponses: 0,
    };
  }

  let totalEarnings = 0;
  let sharedCount = 0;

  earnings.forEach((e) => {
    totalEarnings += parseFloat(e.earningAmount);
    if (e.isShared) sharedCount++;
  });

  return {
    totalEarnings: totalEarnings.toFixed(4),
    averageEarnings: (totalEarnings / earnings.length).toFixed(4),
    totalResponses: earnings.length,
    sharedResponses: sharedCount,
  };
}


// ============ GOOGLE PLAY EARNINGS OPERATIONS ============

export async function recordGooglePlayEarnings(
  userId: number,
  appPackageName: string,
  downloads: number,
  installations: number,
  activeUsers: number,
  earnings: string,
  period: string
) {
  const db = await getDb();
  if (!db) return undefined;

  const commissionRate = 30; // 30% commission
  const netEarnings = (parseFloat(earnings) * (1 - commissionRate / 100)).toFixed(4);

  return await db.insert(googlePlayEarnings).values({
    userId,
    appPackageName,
    downloads,
    installations,
    activeUsers,
    earnings: earnings as any,
    commissionRate: commissionRate.toString() as any,
    netEarnings: netEarnings as any,
    period,
  });
}

export async function recordAppInstallation(
  userId: number,
  appPackageName: string,
  deviceId?: string,
  deviceModel?: string,
  osVersion?: string,
  country?: string
) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.insert(appInstallations).values({
    userId,
    appPackageName,
    deviceId: deviceId || null,
    deviceModel: deviceModel || null,
    osVersion: osVersion || null,
    country: country || null,
  });
}

export async function recordGooglePlayStats(
  userId: number,
  appPackageName: string,
  date: string,
  dailyDownloads: number,
  dailyInstallations: number,
  dailyUninstallations: number,
  activeUsersDaily: number,
  dailyEarnings: string
) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.insert(googlePlayStats).values({
    userId,
    appPackageName,
    date,
    dailyDownloads,
    dailyInstallations,
    dailyUninstallations,
    activeUsersDaily,
    dailyEarnings: dailyEarnings as any,
  });
}

export async function getUserGooglePlayEarnings(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(googlePlayEarnings)
    .where(eq(googlePlayEarnings.userId, userId))
    .orderBy(desc(googlePlayEarnings.createdAt));
}

export async function getUserAppInstallations(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(appInstallations)
    .where(eq(appInstallations.userId, userId))
    .orderBy(desc(appInstallations.installationDate));
}

export async function getActiveInstallations(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(appInstallations)
    .where(and(eq(appInstallations.userId, userId), eq(appInstallations.isActive, true)))
    .orderBy(desc(appInstallations.installationDate));
}

export async function getTotalGooglePlayEarnings(userId: number): Promise<{
  totalEarnings: string;
  netEarnings: string;
  totalDownloads: number;
  totalInstallations: number;
  activeInstallations: number;
}> {
  const db = await getDb();
  if (!db)
    return {
      totalEarnings: "0",
      netEarnings: "0",
      totalDownloads: 0,
      totalInstallations: 0,
      activeInstallations: 0,
    };

  const earnings = await getUserGooglePlayEarnings(userId);
  const installations = await getActiveInstallations(userId);

  let totalEarnings = 0;
  let totalNetEarnings = 0;
  let totalDownloads = 0;
  let totalInstallations = 0;

  earnings.forEach((e) => {
    totalEarnings += parseFloat(e.earnings);
    totalNetEarnings += parseFloat(e.netEarnings);
    totalDownloads += e.downloads;
    totalInstallations += e.installations;
  });

  return {
    totalEarnings: totalEarnings.toFixed(4),
    netEarnings: totalNetEarnings.toFixed(4),
    totalDownloads,
    totalInstallations,
    activeInstallations: installations.length,
  };
}

export async function getGooglePlayStatsByDateRange(
  userId: number,
  startDate: string,
  endDate: string
) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(googlePlayStats)
    .where(
      and(
        eq(googlePlayStats.userId, userId),
        gte(googlePlayStats.date, startDate),
        lte(googlePlayStats.date, endDate)
      )
    )
    .orderBy(desc(googlePlayStats.date));
}

export async function getInstallationsByCountry(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const installations = await db
    .select()
    .from(appInstallations)
    .where(eq(appInstallations.userId, userId));

  const countryStats: Record<string, number> = {};
  installations.forEach((inst) => {
    const country = inst.country || "Unknown";
    countryStats[country] = (countryStats[country] || 0) + 1;
  });

  return Object.entries(countryStats).map(([country, count]) => ({
    country,
    count,
  }));
}

export async function getInstallationsByDevice(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const installations = await db
    .select()
    .from(appInstallations)
    .where(eq(appInstallations.userId, userId));

  const deviceStats: Record<string, number> = {};
  installations.forEach((inst) => {
    const device = inst.deviceModel || "Unknown";
    deviceStats[device] = (deviceStats[device] || 0) + 1;
  });

  return Object.entries(deviceStats).map(([device, count]) => ({
    device,
    count,
  }));
}

export async function uninstallApp(appInstallationId: number) {
  const db = await getDb();
  if (!db) return undefined;

  return await db
    .update(appInstallations)
    .set({
      isActive: false,
      uninstallationDate: new Date(),
    })
    .where(eq(appInstallations.id, appInstallationId));
}


// ============ LIVE USER SESSIONS OPERATIONS ============

export async function startUserSession(
  userId: number,
  sessionId: string,
  deviceId?: string,
  appVersion?: string,
  osType?: string,
  country?: string
) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.insert(liveUserSessions).values({
    userId,
    sessionId,
    deviceId: deviceId || null,
    appVersion: appVersion || null,
    osType: osType || null,
    country: country || null,
  });
}

export async function endUserSession(sessionId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const session = await db
    .select()
    .from(liveUserSessions)
    .where(eq(liveUserSessions.sessionId, sessionId))
    .limit(1);

  if (session.length === 0) return undefined;

  const startTime = session[0].startTime;
  const endTime = new Date();
  const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

  return await db
    .update(liveUserSessions)
    .set({
      isActive: false,
      endTime,
      durationSeconds,
    })
    .where(eq(liveUserSessions.sessionId, sessionId));
}

export async function getActiveUserCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select()
    .from(liveUserSessions)
    .where(eq(liveUserSessions.isActive, true));

  return result.length;
}

export async function recordLiveUserEarning(
  userId: number,
  sessionId: string,
  minuteIndex: number,
  activeUsersCount: number,
  earningPerActiveUser = 0.001
) {
  const db = await getDb();
  if (!db) return undefined;

  const totalEarning = (activeUsersCount * earningPerActiveUser).toFixed(4);

  return await db.insert(liveUserEarnings).values({
    userId,
    sessionId,
    minuteIndex,
    activeUsersCount,
    earningPerActiveUser: earningPerActiveUser.toString() as any,
    totalEarning: totalEarning as any,
  });
}

export async function getUserLiveEarnings(userId: number): Promise<{
  totalEarnings: string;
  totalSessions: number;
  averageEarningPerSession: string;
}> {
  const db = await getDb();
  if (!db)
    return {
      totalEarnings: "0",
      totalSessions: 0,
      averageEarningPerSession: "0",
    };

  const earnings = await db
    .select()
    .from(liveUserEarnings)
    .where(eq(liveUserEarnings.userId, userId));

  const sessions = await db
    .select()
    .from(liveUserSessions)
    .where(and(eq(liveUserSessions.userId, userId), eq(liveUserSessions.isActive, false)));

  let totalEarnings = 0;
  earnings.forEach((e) => {
    totalEarnings += parseFloat(e.totalEarning);
  });

  const averageEarningPerSession =
    sessions.length > 0 ? (totalEarnings / sessions.length).toFixed(4) : "0";

  return {
    totalEarnings: totalEarnings.toFixed(4),
    totalSessions: sessions.length,
    averageEarningPerSession,
  };
}

export async function recordLiveUserStats(
  date: string,
  hour: number,
  totalActiveSessions: number,
  peakActiveUsers: number,
  averageActiveUsers: string,
  totalEarningsFromLiveUsers: string
) {
  const db = await getDb();
  if (!db) return undefined;

  return await db.insert(liveUserStats).values({
    date,
    hour,
    totalActiveSessions,
    peakActiveUsers,
    averageActiveUsers: averageActiveUsers as any,
    totalEarningsFromLiveUsers: totalEarningsFromLiveUsers as any,
  });
}

export async function getLiveUserStatsByDate(date: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(liveUserStats)
    .where(eq(liveUserStats.date, date))
    .orderBy(liveUserStats.hour);
}

export async function getHourlyActiveUsers(date: string): Promise<
  Array<{
    hour: number;
    activeUsers: number;
    earnings: string;
  }>
> {
  const db = await getDb();
  if (!db) return [];

  const stats = await db
    .select()
    .from(liveUserStats)
    .where(eq(liveUserStats.date, date))
    .orderBy(liveUserStats.hour);

  return stats.map((stat) => ({
    hour: stat.hour,
    activeUsers: stat.peakActiveUsers,
    earnings: stat.totalEarningsFromLiveUsers,
  }));
}

export async function getUserSessionHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(liveUserSessions)
    .where(eq(liveUserSessions.userId, userId))
    .orderBy(desc(liveUserSessions.startTime));
}

export async function getTotalCombinedEarnings(userId: number): Promise<{
  surveyEarnings: string;
  googlePlayEarnings: string;
  liveUserEarnings: string;
  totalEarnings: string;
}> {
  const surveyEarnings = await getTotalEarnings(userId);
  const googlePlayEarnings = await getTotalGooglePlayEarnings(userId);
  const liveUserEarnings = await getUserLiveEarnings(userId);

  const total = (
    parseFloat(surveyEarnings.total) +
    parseFloat(googlePlayEarnings.netEarnings) +
    parseFloat(liveUserEarnings.totalEarnings)
  ).toFixed(4);

  return {
    surveyEarnings: surveyEarnings.total,
    googlePlayEarnings: googlePlayEarnings.netEarnings,
    liveUserEarnings: liveUserEarnings.totalEarnings,
    totalEarnings: total,
  };
}


// ============================================
// Social Lite Feed Functions
// ============================================

export async function getPublicFeed(userId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  const feed = await db
    .select({
      id: posts.id,
      userId: posts.userId,
      content: posts.content,
      imageUrl: posts.imageUrl,
      postType: posts.postType,
      visibility: posts.visibility,
      likesCount: posts.likesCount,
      commentsCount: posts.commentsCount,
      sharesCount: posts.sharesCount,
      createdAt: posts.createdAt,
      authorName: users.name,
      authorAvatar: users.profileImage,
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.visibility, "public"))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);

  if (feed.length === 0) return [];
  const postIds = feed.map((post) => post.id);
  const viewerLikes = await db
    .select({ postId: likes.postId })
    .from(likes)
    .where(and(eq(likes.userId, userId), eq(likes.likeType, "post"), inArray(likes.postId, postIds)));
  const likedPostIds = new Set(viewerLikes.map((like) => like.postId));

  return feed.map((post) => ({ ...post, likedByViewer: likedPostIds.has(post.id) }));
}

export async function createPost(post: typeof posts.$inferInsert) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(posts).values(post);
  return result;
}

export async function togglePostLike(userId: number, postId: number) {
  const db = await getDb();
  if (!db) return { liked: false, likesCount: 0 };

  const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post[0]) return undefined;

  const existing = await db
    .select({ id: likes.id })
    .from(likes)
    .where(and(eq(likes.userId, userId), eq(likes.postId, postId), eq(likes.likeType, "post")))
    .limit(1);

  if (existing[0]) {
    await db.delete(likes).where(eq(likes.id, existing[0].id));
    await db.update(posts).set({ likesCount: sql`${posts.likesCount} - 1` }).where(eq(posts.id, postId));
    return { liked: false, likesCount: Math.max(0, post[0].likesCount - 1) };
  }

  await db.insert(likes).values({ userId, postId, likeType: "post" });
  await db.update(posts).set({ likesCount: sql`${posts.likesCount} + 1` }).where(eq(posts.id, postId));
  if (post[0].userId !== userId) {
    await db.insert(socialNotifications).values({
      userId: post[0].userId,
      fromUserId: userId,
      notificationType: "like",
      postId,
      isRead: false,
    });
  }
  return { liked: true, likesCount: post[0].likesCount + 1 };
}

export async function getPostComments(postId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: comments.id,
      postId: comments.postId,
      userId: comments.userId,
      content: comments.content,
      likesCount: comments.likesCount,
      createdAt: comments.createdAt,
      authorName: users.name,
      authorAvatar: users.profileImage,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt))
    .limit(100);
}

export async function createPostComment(postId: number, userId: number, content: string) {
  const db = await getDb();
  if (!db) return undefined;
  const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post[0]) return undefined;

  const result = await db.insert(comments).values({ postId, userId, content });
  await db.update(posts).set({ commentsCount: sql`${posts.commentsCount} + 1` }).where(eq(posts.id, postId));
  if (post[0].userId !== userId) {
    await db.insert(socialNotifications).values({
      userId: post[0].userId,
      fromUserId: userId,
      notificationType: "comment",
      postId,
      isRead: false,
    });
  }
  return result;
}

// ============================================
// Follow Notification Functions
// ============================================

/**
 * Create a follow notification when a user follows another user
 */
export async function createFollowNotification(
  userId: number,
  fromUserId: number
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create notification: database not available");
    return;
  }

  try {
    await db.insert(socialNotifications).values({
      userId,
      fromUserId,
      notificationType: "follow",
      isRead: false,
    });
  } catch (error) {
    console.error("[Database] Failed to create follow notification:", error);
    throw error;
  }
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get notifications: database not available");
    return [];
  }

  try {
    const notifications = await db
      .select({
        id: socialNotifications.id,
        notificationType: socialNotifications.notificationType,
        fromUserId: socialNotifications.fromUserId,
        fromUserName: users.name,
        fromUserAvatar: users.profileImage,
        postId: socialNotifications.postId,
        commentId: socialNotifications.commentId,
        createdAt: socialNotifications.createdAt,
        isRead: socialNotifications.isRead,
      })
      .from(socialNotifications)
      .innerJoin(users, eq(socialNotifications.fromUserId, users.id))
      .where(
        and(
          eq(socialNotifications.userId, userId),
          eq(socialNotifications.isRead, false)
        )
      )
      .orderBy(desc(socialNotifications.createdAt))
      .limit(50);

    return notifications;
  } catch (error) {
    console.error("[Database] Failed to get notifications:", error);
    throw error;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot mark notification: database not available");
    return;
  }

  try {
    await db
      .update(socialNotifications)
      .set({ isRead: true })
      .where(eq(socialNotifications.id, notificationId));
  } catch (error) {
    console.error("[Database] Failed to mark notification as read:", error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot mark notifications: database not available");
    return;
  }

  try {
    await db
      .update(socialNotifications)
      .set({ isRead: true })
      .where(
        and(
          eq(socialNotifications.userId, userId),
          eq(socialNotifications.isRead, false)
        )
      );
  } catch (error) {
    console.error("[Database] Failed to mark all notifications as read:", error);
    throw error;
  }
}

/**
 * Get notification count for a user
 */
export async function getNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get notification count: database not available");
    return 0;
  }

  try {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(socialNotifications)
      .where(
        and(
          eq(socialNotifications.userId, userId),
          eq(socialNotifications.isRead, false)
        )
      );

    return result[0]?.count || 0;
  } catch (error) {
    console.error("[Database] Failed to get notification count:", error);
    throw error;
  }
}

/**
 * Delete old notifications (older than 30 days)
 */
export async function deleteOldNotifications(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete notifications: database not available");
    return;
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await db
      .delete(socialNotifications)
      .where(lt(socialNotifications.createdAt, thirtyDaysAgo));
  } catch (error) {
    console.error("[Database] Failed to delete old notifications:", error);
    throw error;
  }
}
