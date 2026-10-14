import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMock = vi.hoisted(() => ({
  getAdminOverview: vi.fn(),
  getAllSurveysAdmin: vi.fn(),
  createSurvey: vi.fn(),
  logActivity: vi.fn(),
  getAdvertisementById: vi.fn(),
  createAdSchedule: vi.fn(),
}));

vi.mock("./db", () => dbMock);

import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(role: "admin" | "user"): TrpcContext {
  const now = new Date();
  const user: AuthenticatedUser = {
    id: role === "admin" ? 1 : 2,
    openId: `${role}-test-user`,
    name: role === "admin" ? "Admin Tester" : "Member Tester",
    email: `${role}@example.com`,
    loginMethod: "test",
    role,
    totalPoints: 0,
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
  return { user, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

beforeEach(() => vi.resetAllMocks());

describe("admin operations", () => {
  it("blocks overview access for non-admin users", async () => {
    const caller = appRouter.createCaller(createContext("user"));

    await expect(caller.admin.overview()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(dbMock.getAdminOverview).not.toHaveBeenCalled();
  });

  it("returns live overview data to administrators", async () => {
    const overview = { totalUsers: 4, activeUsers: 3, totalSurveys: 2, activeSurveys: 1, totalResponses: 9, totalPointsDistributed: 80, pendingWithdrawals: 1, activeAdvertisements: 2, totalAdClicks: 6 };
    dbMock.getAdminOverview.mockResolvedValueOnce(overview);
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(caller.admin.overview()).resolves.toEqual(overview);
    expect(dbMock.getAdminOverview).toHaveBeenCalledOnce();
  });

  it("creates a structured survey only through the admin procedure", async () => {
    dbMock.createSurvey.mockResolvedValueOnce({});
    dbMock.logActivity.mockResolvedValueOnce({});
    const caller = appRouter.createCaller(createContext("admin"));

    const result = await caller.survey.create({
      title: "Admin-created research",
      description: "A live catalog item",
      categoryId: 1,
      pointsReward: 20,
      estimatedTime: 5,
      questions: [{ id: 1, text: "What do you think?", type: "text" }],
      status: "active",
    });

    expect(result).toEqual({ success: true });
    expect(dbMock.createSurvey).toHaveBeenCalledWith(expect.objectContaining({
      title: "Admin-created research",
      questions: JSON.stringify([{ id: 1, text: "What do you think?", type: "text" }]),
      status: "active",
    }));
  });

  it("requires an existing advertisement before scheduling it", async () => {
    dbMock.getAdvertisementById.mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(caller.advertisement.createSchedule({
      adId: 999,
      scheduleType: "once",
      startDate: new Date("2026-10-04T09:00:00Z"),
      timezone: "UTC",
    })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(dbMock.createAdSchedule).not.toHaveBeenCalled();
  });
});
