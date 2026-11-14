import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context.ts";

const dbMock = vi.hoisted(() => ({
  getUserByContact: vi.fn(),
  updateUserProfile: vi.fn(),
  getUserById: vi.fn(),
  logActivity: vi.fn(),
}));

vi.mock("./db", () => dbMock);

import { appRouter } from "./routers.ts";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function context(): TrpcContext {
  const now = new Date();
  const user: AuthenticatedUser = { id: 8, openId: "validation-user", name: "Validation User", email: "user@example.com", loginMethod: "test", role: "user", totalPoints: 0, createdAt: now, updatedAt: now, lastSignedIn: now };
  return { user, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

beforeEach(() => vi.resetAllMocks());

describe("account validation", () => {
  it("normalizes email and accepts an international phone number", async () => {
    dbMock.getUserByContact.mockResolvedValueOnce(undefined);
    dbMock.getUserById.mockResolvedValueOnce({ id: 8, email: "person@example.com" });
    const caller = appRouter.createCaller(context());

    await caller.user.updateProfile({ email: "  Person@Example.COM ", phone: "+33123456789", name: "Person Name" });

    expect(dbMock.getUserByContact).toHaveBeenCalledWith("person@example.com", "+33123456789");
    expect(dbMock.updateUserProfile).toHaveBeenCalledWith(8, { email: "person@example.com", phone: "+33123456789", name: "Person Name" });
  });

  it("rejects invalid phone numbers before database access", async () => {
    const caller = appRouter.createCaller(context());

    await expect(caller.user.updateProfile({ phone: "123" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(dbMock.getUserByContact).not.toHaveBeenCalled();
  });

  it("rejects contact collisions with another account", async () => {
    dbMock.getUserByContact.mockResolvedValueOnce({ id: 99, email: "other@example.com" });
    const caller = appRouter.createCaller(context());

    await expect(caller.user.updateProfile({ email: "other@example.com" })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(dbMock.updateUserProfile).not.toHaveBeenCalled();
  });

  it("persists a valid onboarding completion in the activity log", async () => {
    const caller = appRouter.createCaller(context());
    const data = { reasonJoin: "I want to learn and earn through research", mainInterest: "Professional technology and useful services", contentYouLike: "Practical educational content and product reviews", contentYouPost: "Helpful notes about tools and work experiences", goal30Days: "Complete quality surveys consistently this month", workStyle: "I read instructions carefully and submit honest answers" };

    await expect(caller.user.completeOnboarding(data)).resolves.toEqual({ success: true });
    expect(dbMock.logActivity).toHaveBeenCalledWith(8, "onboarding_completed", "Completed the mandatory onboarding survey", data);
  });
});
