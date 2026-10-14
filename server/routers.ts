import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { aiSummarizerRouter } from "./routers/aiSummarizer";

// Helper function to create admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

const normalizedEmail = (value: string) => value.trim().toLowerCase();

export const appRouter = router({
  system: systemRouter,
  aiSummarizer: aiSummarizerRouter,

  // ============ AUTH ROUTES ============
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ USER ROUTES ============
  user: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserById(ctx.user.id);
    }),

    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().trim().min(2).max(100).optional(),
          email: z.string().trim().email().transform(normalizedEmail).optional(),
          phone: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/, "Use an international phone format, for example +33123456789").optional(),
          paypalEmail: z.string().trim().email().transform(normalizedEmail).optional(),
          googlePoints: z.string().trim().regex(/^\d+$/, "Google Points must contain digits only").optional(),
          profileImage: z.string().trim().url().optional(),
          bio: z.string().trim().max(2000).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await db.getUserByContact(input.email, input.phone);
        if (existing && existing.id !== ctx.user.id) {
          throw new TRPCError({ code: "CONFLICT", message: "That email or phone number is already linked to another account" });
        }
        await db.updateUserProfile(ctx.user.id, input);
        return await db.getUserById(ctx.user.id);
      }),

    completeOnboarding: protectedProcedure
      .input(z.object({
        reasonJoin: z.string().trim().min(10).max(2000),
        mainInterest: z.string().trim().min(10).max(2000),
        contentYouLike: z.string().trim().min(10).max(2000),
        contentYouPost: z.string().trim().min(10).max(2000),
        goal30Days: z.string().trim().min(10).max(2000),
        workStyle: z.string().trim().min(10).max(2000),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.logActivity(ctx.user.id, "onboarding_completed", "Completed the mandatory onboarding survey", input);
        return { success: true };
      }),

    getBalance: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      return {
        totalPoints: user?.totalPoints || 0,
        availableBalance: user?.availableBalance || "0.00",
        totalWithdrawn: user?.totalWithdrawn || "0.00",
      };
    }),

    getPointsHistory: protectedProcedure
      .input(
        z.object({
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        return await db.getUserPointsHistory(ctx.user.id, input.limit, input.offset);
      }),

    getActivityLog: protectedProcedure
      .input(
        z.object({
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        return await db.getUserActivityLog(ctx.user.id, input.limit, input.offset);
      }),
  }),

  // ============ SURVEY ROUTES ============
  survey: router({
    list: publicProcedure
      .input(
        z.object({
          categoryId: z.number().optional(),
          minPoints: z.number().optional(),
          maxPoints: z.number().optional(),
          limit: z.number().default(20),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input }) => {
        let surveys = await db.getActiveSurveys(input.limit, input.offset);

        // Filter by category
        if (input.categoryId) {
          surveys = surveys.filter((s) => s.categoryId === input.categoryId);
        }

        // Filter by points
        if (input.minPoints !== undefined) {
          surveys = surveys.filter((s) => s.pointsReward >= (input.minPoints || 0));
        }
        if (input.maxPoints !== undefined) {
          surveys = surveys.filter((s) => s.pointsReward <= (input.maxPoints || 999999));
        }

        return surveys;
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const survey = await db.getSurveyById(input.id);
        if (!survey) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Survey not found" });
        }
        return survey;
      }),

    availableForUser: protectedProcedure
      .input(
        z.object({
          categoryId: z.number().optional(),
          level: z.number().int().min(1).max(5).optional(),
          limit: z.number().int().min(1).max(100).default(50),
          offset: z.number().int().min(0).default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        const userLevel = await db.getUserLevel(ctx.user.id);
        const currentLevel = userLevel?.currentLevel ?? 1;
        if (input.level && input.level > currentLevel) return [];

        const surveys = input.level
          ? await db.getSurveysByLevel(input.level, input.limit, input.offset)
          : await db.getAvailableSurveysForUser(ctx.user.id, input.limit, input.offset);

        return input.categoryId
          ? surveys.filter((survey) => survey.categoryId === input.categoryId)
          : surveys;
      }),

    categories: protectedProcedure.query(async () => db.getAllCategories()),

    completedIds: protectedProcedure.query(async ({ ctx }) => db.getCompletedSurveyIds(ctx.user.id)),

    levelProgress: protectedProcedure.query(async ({ ctx }) => {
      const userLevel = await db.getUserLevel(ctx.user.id);
      const currentLevel = userLevel?.currentLevel ?? 1;
      const requirements = await db.getLevelRequirements();
      const nextRequirement = requirements.find((requirement) => requirement.level === currentLevel + 1);

      return {
        currentLevel,
        totalPointsEarned: userLevel?.totalPointsEarned ?? ctx.user.totalPoints ?? 0,
        pointsInLevel: userLevel?.pointsInLevel ?? ctx.user.totalPoints ?? 0,
        nextLevel: nextRequirement?.level ?? null,
        nextLevelRequiredPoints: nextRequirement?.requiredPoints ?? null,
      };
    }),

    checkCompletion: protectedProcedure
      .input(z.object({ surveyId: z.number() }))
      .query(async ({ ctx, input }) => {
        const response = await db.checkUserSurveyResponse(ctx.user.id, input.surveyId);
        return {
          isCompleted: !!response,
          pointsEarned: response?.pointsAwarded || 0,
        };
      }),

    submit: protectedProcedure
      .input(
        z.object({
          surveyId: z.number().int().positive(),
          answers: z.array(
            z.object({
              questionId: z.number().int().positive(),
              answer: z.unknown(),
            })
          ).min(1),
          adWatchedSeconds: z.number().int().min(26),
          timeSpentSeconds: z.number().int().min(0).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await db.checkUserSurveyResponse(ctx.user.id, input.surveyId);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "You have already completed this survey" });
        }

        const survey = await db.getSurveyById(input.surveyId);
        if (!survey) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Survey not found" });
        }
        if (survey.status !== "active") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This survey is not currently accepting responses" });
        }
        const now = new Date();
        if (survey.startDate && survey.startDate > now) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This survey has not started yet" });
        }
        if (survey.endDate && survey.endDate < now) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This survey is no longer available" });
        }
        if (survey.maxResponses !== null && survey.currentResponses >= survey.maxResponses) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This survey has reached its response limit" });
        }

        let questions: Array<{ id?: number; required?: boolean }> = [];
        try {
          const parsed = survey.questions ? JSON.parse(survey.questions) : [];
          questions = Array.isArray(parsed) ? parsed : [];
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Survey questions are not configured correctly" });
        }
        const answersByQuestion = new Map(input.answers.map((answer) => [answer.questionId, answer.answer]));
        const requiredQuestionIds = questions
          .filter((question) => question.required !== false && typeof question.id === "number")
          .map((question) => question.id as number);
        const missingAnswer = requiredQuestionIds.some((questionId) => {
          const answer = answersByQuestion.get(questionId);
          return answer === undefined || answer === null || answer === "" || (Array.isArray(answer) && answer.length === 0);
        });
        if (missingAnswer) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Please answer all required questions" });
        }

        try {
          await db.createSurveyResponse({
            surveyId: input.surveyId,
            userId: ctx.user.id,
            answers: JSON.stringify(input.answers),
            pointsAwarded: survey.pointsReward,
            timeSpentSeconds: input.timeSpentSeconds,
            isCompleted: true,
            completedAt: new Date(),
          });
        } catch (error: unknown) {
          if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ER_DUP_ENTRY") {
            throw new TRPCError({ code: "CONFLICT", message: "You have already completed this survey" });
          }
          throw error;
        }

        await db.incrementSurveyResponses(input.surveyId);
        await db.addPoints(ctx.user.id, survey.pointsReward, "earned", `Completed survey: ${survey.title}`, input.surveyId);
        await db.logActivity(ctx.user.id, "survey_completed", `Completed survey: ${survey.title}`, {
          surveyId: input.surveyId,
          pointsEarned: survey.pointsReward,
          adWatchedSeconds: input.adWatchedSeconds,
          timeSpentSeconds: input.timeSpentSeconds ?? null,
        });
        return {
          success: true,
          pointsEarned: survey.pointsReward,
        };
      }),
    // Admin routes
    create: adminProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          categoryId: z.number(),
          pointsReward: z.number(),
          estimatedTime: z.number().optional(),
          questions: z.array(z.any()),
          status: z.enum(["draft", "active", "paused", "completed"]).default("draft"),
          maxResponses: z.number().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await db.createSurvey({
          ...input,
          questions: JSON.stringify(input.questions),
          status: input.status as any,
        });

        await db.logActivity(0, "survey_created", `Created survey: ${input.title}`, {
          title: input.title,
        });

        return { success: true };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          categoryId: z.number().optional(),
          pointsReward: z.number().optional(),
          status: z.enum(["draft", "active", "paused", "completed"]).optional(),
          questions: z.array(z.any()).optional(),
          maxResponses: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const updates: any = { ...input };
        if (input.questions) {
          updates.questions = JSON.stringify(input.questions);
        }
        delete updates.id;

        await db.updateSurvey(input.id, updates);
        return await db.getSurveyById(input.id);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateSurvey(input.id, { status: "completed" as any });
        return { success: true };
      }),
  }),

  // ============ WITHDRAWAL ROUTES ============
  withdrawal: router({
    getRequests: protectedProcedure
      .input(
        z.object({
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        return await db.getUserWithdrawalRequests(ctx.user.id, input.limit, input.offset);
      }),

    create: protectedProcedure
      .input(
        z.object({
          pointsRequested: z.number().min(100),
          paymentMethod: z.enum(["paypal", "bank_transfer", "stripe"]),
          paymentDetails: z.record(z.string(), z.any()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        // Check minimum withdrawal
        const minWithdrawal = 100; // 100 points = $10
        if (input.pointsRequested < minWithdrawal) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Minimum withdrawal is ${minWithdrawal} points`,
          });
        }

        // Check available points
        if (user.totalPoints < input.pointsRequested) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Insufficient points",
          });
        }

        // Calculate amount (1 point = $0.1)
        const amountRequested = (input.pointsRequested * 0.1).toFixed(2);

        await db.createWithdrawalRequest({
          userId: ctx.user.id,
          pointsRequested: input.pointsRequested,
          amountRequested,
          conversionRate: "0.1",
          paymentMethod: input.paymentMethod as any,
          paymentDetails: input.paymentDetails ? JSON.stringify(input.paymentDetails) : undefined,
          status: "pending" as any,
        });

        // Create admin notification
        await db.createAdminNotification({
          title: "New Withdrawal Request",
          content: `User ${user.name} requested withdrawal of ${input.pointsRequested} points ($${amountRequested})`,
          type: "new_withdrawal" as any,
          userId: ctx.user.id,
        });

        // Log activity
        await db.logActivity(ctx.user.id, "withdrawal_requested", `Requested withdrawal of ${input.pointsRequested} points`, {
          amount: amountRequested,
        });

        return {
          success: true,
          amount: amountRequested,
        };
      }),

    // Admin routes
    getAllRequests: adminProcedure
      .input(
        z.object({
          status: z.enum(["pending", "approved", "rejected", "completed", "failed"]).optional(),
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input }) => {
        return await db.getAllWithdrawalRequests(input.status, input.limit, input.offset);
      }),

    approve: adminProcedure
      .input(
        z.object({
          id: z.number(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const request = await db.getWithdrawalRequestById(input.id);
        if (!request) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Withdrawal request not found" });
        }

        await db.updateWithdrawalRequest(input.id, {
          status: "approved" as any,
          processedAt: new Date(),
          adminNotes: input.notes,
        });

        return { success: true };
      }),

    reject: adminProcedure
      .input(
        z.object({
          id: z.number(),
          notes: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const request = await db.getWithdrawalRequestById(input.id);
        if (!request) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Withdrawal request not found" });
        }

        // Refund points
        await db.addPoints(request.userId, request.pointsRequested, "refunded", "Withdrawal request rejected", undefined);

        await db.updateWithdrawalRequest(input.id, {
          status: "rejected" as any,
          processedAt: new Date(),
          adminNotes: input.notes,
        });

        return { success: true };
      }),
  }),

  // ============ CATEGORY ROUTES ============
  category: router({
    list: publicProcedure.query(async () => {
      return await db.getAllCategories();
    }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          icon: z.string().optional(),
          color: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createCategory(input);
      }),
  }),

  // ============ REFERRAL ROUTES ============
  referral: router({
    getMyLink: protectedProcedure.query(async ({ ctx }) => {
      const host = typeof ctx.req.get === "function" ? ctx.req.get("host") : undefined;
      const forwardedProto = typeof ctx.req.get === "function" ? ctx.req.get("x-forwarded-proto") : undefined;
      const baseUrl = process.env.PUBLIC_APP_URL ?? (host ? `${forwardedProto ?? "https"}://${host}` : "https://manasurvey-cbjpxr7g.manus.space");
      const link = await db.getOrCreateReferralLink(ctx.user.id, baseUrl);
      if (!link) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to create your referral link" });
      const stats = await db.getReferralStats(ctx.user.id);
      return stats ?? {
        referralCode: link.referralCode,
        referralUrl: link.referralUrl,
        totalInvites: link.totalInvites,
        successfulInvites: link.successfulInvites,
        totalRewardsEarned: link.totalRewardsEarned,
        recentRewards: [],
      };
    }),

    claim: protectedProcedure
      .input(z.object({ referralCode: z.string().trim().regex(/^[a-f0-9]{12}$/i) }))
      .mutation(async ({ ctx, input }) => {
        const link = await db.getReferralLinkByCode(input.referralCode);
        if (!link || !link.isActive) throw new TRPCError({ code: "NOT_FOUND", message: "Referral link not found or inactive" });
        if (link.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot claim your own referral link" });
        const result = await db.recordReferral(link.userId, ctx.user.id);
        if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to process referral" });
        if ("rejected" in result && result.rejected) throw new TRPCError({ code: "BAD_REQUEST", message: "Referral was rejected" });
        if (!result.alreadyRecorded) {
          await db.logActivity(ctx.user.id, "referral_completed", `Joined through referral link: ${link.referralCode}`, { referrerId: link.userId, rewardAmount: "0.10" });
        }
        return result;
      }),
  }),

  // ============ ADMIN ROUTES ============
  admin: router({
    overview: adminProcedure.query(async () => db.getAdminOverview()),

    surveys: adminProcedure
      .input(z.object({ limit: z.number().int().min(1).max(200).default(100), offset: z.number().int().min(0).default(0) }))
      .query(async ({ input }) => db.getAllSurveysAdmin(input.limit, input.offset)),

    getNotifications: adminProcedure
      .input(
        z.object({
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input }) => {
        return await db.getAdminNotifications(input.limit, input.offset);
      }),

    markNotificationAsRead: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markAdminNotificationAsRead(input.id);
        return { success: true };
      }),

    getStats: adminProcedure.query(async () => {
      const today = new Date().toISOString().split("T")[0];
      const stats = await db.getAnalytics(today);

      return {
        totalUsers: stats?.totalUsers || 0,
        newUsers: stats?.newUsers || 0,
        activeUsers: stats?.activeUsers || 0,
        totalSurveys: stats?.totalSurveys || 0,
        activeSurveys: stats?.activeSurveys || 0,
        completedResponses: stats?.completedResponses || 0,
        totalPointsDistributed: stats?.totalPointsDistributed || 0,
        totalMoneyDistributed: stats?.totalMoneyDistributed || "0.00",
        totalWithdrawalRequests: stats?.totalWithdrawalRequests || 0,
        approvedWithdrawals: stats?.approvedWithdrawals || 0,
      };
    }),
  }),

  // ============ ADVERTISEMENT ROUTES ============
  advertisement: router({
    list: publicProcedure
      .input(
        z.object({
          limit: z.number().default(10),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input }) => {
        return await db.getActiveAdvertisements(input.limit, input.offset);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const ad = await db.getAdvertisementById(input.id);
        if (!ad) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Advertisement not found" });
        }
        return ad;
      }),

    click: protectedProcedure
      .input(
        z.object({
          adId: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const ad = await db.getAdvertisementById(input.adId);
        if (!ad) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Advertisement not found" });
        }

        if (ad.status !== "active") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Advertisement is not active" });
        }

        // Check if max clicks reached
        if (ad.maxClicks && ad.currentClicks >= ad.maxClicks) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Advertisement has reached max clicks" });
        }

        // Record the click and award digital currency
        const result = await db.recordAdClick(ctx.user.id, input.adId, ad.rewardAmount);

        // Log activity
        await db.logActivity(ctx.user.id, "ad_clicked", `Clicked advertisement: ${ad.title}`, {
          adId: input.adId,
          rewardEarned: ad.rewardAmount,
        });

        return result;
      }),

    recordSurveyView: protectedProcedure
      .input(z.object({
        surveyId: z.number().int().positive(),
        adId: z.number().int().positive().nullable().optional(),
        viewDuration: z.number().int().min(26).max(3600),
      }))
      .mutation(async ({ ctx, input }) => {
        const survey = await db.getSurveyById(input.surveyId);
        if (!survey) throw new TRPCError({ code: "NOT_FOUND", message: "Survey not found" });
        return db.recordSurveyAdView(ctx.user.id, input.surveyId, input.adId ?? null, input.viewDuration);
      }),

    getUserClicks: protectedProcedure
      .input(
        z.object({
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        return await db.getUserAdClicks(ctx.user.id, input.limit, input.offset);
      }),

    // Admin routes
    adminList: adminProcedure
      .input(z.object({ limit: z.number().int().min(1).max(200).default(100), offset: z.number().int().min(0).default(0) }))
      .query(async ({ input }) => db.getAllAdvertisementsAdmin(input.limit, input.offset)),

    scheduleList: adminProcedure
      .input(z.object({ limit: z.number().int().min(1).max(200).default(100), offset: z.number().int().min(0).default(0) }))
      .query(async ({ input }) => db.getAllAdSchedules(input.limit, input.offset)),

    create: adminProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          advertiserName: z.string(),
          advertiserUrl: z.string().url(),
          imageUrl: z.string().optional(),
          rewardAmount: z.number().default(10000),
          rewardType: z.enum(["digital_currency", "points", "cash"]).default("digital_currency"),
          dailyBudget: z.string().optional(),
          totalBudget: z.string().optional(),
          maxClicks: z.number().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createAdvertisement({
          ...input,
          status: "active" as any,
        });
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["active", "paused", "ended"]).optional(),
          dailyBudget: z.string().optional(),
          totalBudget: z.string().optional(),
          maxClicks: z.number().optional(),
          endDate: z.date().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const updates: any = { ...input };
        delete updates.id;

        await db.updateAdvertisement(input.id, updates);
        return await db.getAdvertisementById(input.id);
      }),

    createSchedule: adminProcedure
      .input(z.object({
        adId: z.number().int().positive(),
        scheduleType: z.enum(["once", "daily", "weekly", "monthly"]).default("once"),
        startDate: z.coerce.date(),
        endDate: z.coerce.date().optional(),
        startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
        endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
        daysOfWeek: z.string().max(50).optional(),
        timezone: z.string().max(50).default("UTC"),
        maxDailyBudget: z.string().optional(),
        notes: z.string().max(1000).optional(),
      }))
      .mutation(async ({ input }) => {
        const ad = await db.getAdvertisementById(input.adId);
        if (!ad) throw new TRPCError({ code: "NOT_FOUND", message: "Advertisement not found" });
        await db.createAdSchedule({ ...input, isActive: true });
        return { success: true };
      }),

    updateSchedule: adminProcedure
      .input(z.object({ id: z.number().int().positive(), isActive: z.boolean().optional(), endDate: z.coerce.date().optional(), notes: z.string().max(1000).optional() }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateAdSchedule(id, updates);
        return { success: true };
      }),
  }),

  // ============ DIGITAL CURRENCY ROUTES ============
  currency: router({
    getBalance: protectedProcedure.query(async ({ ctx }) => {
      return await db.getDigitalCurrencyBalance(ctx.user.id);
    }),

    convertToUSD: publicProcedure
      .input(z.object({ digitalCurrency: z.number() }))
      .query(({ input }) => {
        return {
          digitalCurrency: input.digitalCurrency,
          usd: db.convertDigitalCurrencyToUSD(input.digitalCurrency),
        };
      }),

    convertToDigitalCurrency: publicProcedure
      .input(z.object({ usd: z.number() }))
      .query(({ input }) => {
        return {
          usd: input.usd,
          digitalCurrency: db.convertUSDToDigitalCurrency(input.usd),
        };
      }),
  }),

  // ============ SOCIAL ROUTES ============
  social: router({
    feed: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(50).default(20), offset: z.number().int().min(0).default(0) }))
      .query(async ({ ctx, input }) => db.getPublicFeed(ctx.user.id, input.limit, input.offset)),

    createPost: protectedProcedure
      .input(z.object({
        content: z.string().trim().min(1).max(5000),
        imageUrl: z.string().url().optional(),
        postType: z.enum(["text", "image", "poll", "ad"]).default("text"),
        visibility: z.enum(["public", "private", "friends"]).default("public"),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createPost({ ...input, userId: ctx.user.id });
        return { success: true };
      }),

    toggleLike: protectedProcedure
      .input(z.object({ postId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.togglePostLike(ctx.user.id, input.postId);
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
        return result;
      }),

    comments: protectedProcedure
      .input(z.object({ postId: z.number().int().positive() }))
      .query(async ({ input }) => db.getPostComments(input.postId)),

    addComment: protectedProcedure
      .input(z.object({ postId: z.number().int().positive(), content: z.string().trim().min(1).max(1000) }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createPostComment(input.postId, ctx.user.id, input.content);
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
        return { success: true };
      }),

    getUnreadNotifications: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUnreadNotifications(ctx.user.id);
    }),

    getNotificationCount: protectedProcedure.query(async ({ ctx }) => {
      return await db.getNotificationCount(ctx.user.id);
    }),

    markNotificationAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationAsRead(input.notificationId);
        return { success: true };
      }),

    markAllNotificationsAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
