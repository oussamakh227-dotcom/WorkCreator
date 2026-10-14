import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMock = vi.hoisted(() => ({
  getOrCreateReferralLink: vi.fn(),
  getReferralStats: vi.fn(),
  getReferralLinkByCode: vi.fn(),
  recordReferral: vi.fn(),
  logActivity: vi.fn(),
}));

vi.mock("./db", () => dbMock);

import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
function context(id = 8): TrpcContext {
  const now = new Date();
  const user: AuthenticatedUser = { id, openId: `referral-${id}`, name: "Referral User", email: `referral-${id}@example.com`, loginMethod: "test", role: "user", totalPoints: 0, createdAt: now, updatedAt: now, lastSignedIn: now };
  return { user, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

beforeEach(() => vi.resetAllMocks());

describe("referral routes", () => {
  it("creates and returns the member referral link with stats", async () => {
    const link = { referralCode: "abcdef123456", referralUrl: "https://workfriends.example/referral/abcdef123456", totalInvites: 0, successfulInvites: 0, totalRewardsEarned: "0.00" };
    dbMock.getOrCreateReferralLink.mockResolvedValueOnce({ id: 1, userId: 8, ...link });
    dbMock.getReferralStats.mockResolvedValueOnce({ ...link, recentRewards: [] });
    const caller = appRouter.createCaller(context());

    await expect(caller.referral.getMyLink()).resolves.toEqual({ ...link, recentRewards: [] });
    expect(dbMock.getOrCreateReferralLink).toHaveBeenCalledWith(8, expect.any(String));
  });

  it("rejects an attempt to claim an own referral link", async () => {
    dbMock.getReferralLinkByCode.mockResolvedValueOnce({ userId: 8, isActive: true, referralCode: "abcdef123456" });
    const caller = appRouter.createCaller(context(8));

    await expect(caller.referral.claim({ referralCode: "abcdef123456" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(dbMock.recordReferral).not.toHaveBeenCalled();
  });

  it("credits a new referral and logs it once", async () => {
    dbMock.getReferralLinkByCode.mockResolvedValueOnce({ userId: 3, isActive: true, referralCode: "abcdef123456" });
    dbMock.recordReferral.mockResolvedValueOnce({ alreadyRecorded: false, rejected: false, rewardAmount: "0.10", rewardInDigitalCurrency: 100000 });
    dbMock.logActivity.mockResolvedValueOnce({});
    const caller = appRouter.createCaller(context(8));

    await expect(caller.referral.claim({ referralCode: "abcdef123456" })).resolves.toMatchObject({ rewardAmount: "0.10" });
    expect(dbMock.recordReferral).toHaveBeenCalledWith(3, 8);
    expect(dbMock.logActivity).toHaveBeenCalledWith(8, "referral_completed", expect.any(String), expect.objectContaining({ referrerId: 3 }));
  });

  it("does not log or award a duplicate claim", async () => {
    dbMock.getReferralLinkByCode.mockResolvedValueOnce({ userId: 3, isActive: true, referralCode: "abcdef123456" });
    dbMock.recordReferral.mockResolvedValueOnce({ alreadyRecorded: true, rejected: false });
    const caller = appRouter.createCaller(context(8));

    await expect(caller.referral.claim({ referralCode: "abcdef123456" })).resolves.toEqual({ alreadyRecorded: true, rejected: false });
    expect(dbMock.logActivity).not.toHaveBeenCalled();
  });
});
