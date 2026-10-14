import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMock = vi.hoisted(() => ({
  getPublicFeed: vi.fn(),
  createPost: vi.fn(),
  togglePostLike: vi.fn(),
  getPostComments: vi.fn(),
  createPostComment: vi.fn(),
}));

vi.mock("./db", () => dbMock);

import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(): TrpcContext {
  const now = new Date();
  const user: AuthenticatedUser = {
    id: 11,
    openId: "social-test-user",
    name: "Social Tester",
    email: "social@example.com",
    loginMethod: "test",
    role: "user",
    totalPoints: 0,
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
  return { user, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

beforeEach(() => vi.resetAllMocks());

describe("social feed", () => {
  it("returns the authenticated user's public feed", async () => {
    const feed = [{ id: 1, userId: 4, content: "Hello community", likedByViewer: false }];
    dbMock.getPublicFeed.mockResolvedValueOnce(feed);
    const caller = appRouter.createCaller(createContext());

    const result = await caller.social.feed({ limit: 20, offset: 0 });

    expect(result).toEqual(feed);
    expect(dbMock.getPublicFeed).toHaveBeenCalledWith(11, 20, 0);
  });

  it("validates and creates a public post", async () => {
    dbMock.createPost.mockResolvedValueOnce({});
    const caller = appRouter.createCaller(createContext());

    const result = await caller.social.createPost({ content: "A useful update", postType: "text", visibility: "public" });

    expect(result).toEqual({ success: true });
    expect(dbMock.createPost).toHaveBeenCalledWith({
      content: "A useful update",
      postType: "text",
      visibility: "public",
      userId: 11,
    });
  });

  it("rejects empty posts before touching the database", async () => {
    const caller = appRouter.createCaller(createContext());

    await expect(caller.social.createPost({ content: "   ", postType: "text", visibility: "public" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(dbMock.createPost).not.toHaveBeenCalled();
  });

  it("toggles a like through the protected procedure", async () => {
    dbMock.togglePostLike.mockResolvedValueOnce({ liked: true, likesCount: 3 });
    const caller = appRouter.createCaller(createContext());

    const result = await caller.social.toggleLike({ postId: 9 });

    expect(result).toEqual({ liked: true, likesCount: 3 });
    expect(dbMock.togglePostLike).toHaveBeenCalledWith(11, 9);
  });

  it("creates a comment and returns a not-found error for missing posts", async () => {
    dbMock.createPostComment.mockResolvedValueOnce({});
    const caller = appRouter.createCaller(createContext());

    await expect(caller.social.addComment({ postId: 9, content: "Thanks for sharing" })).resolves.toEqual({ success: true });
    expect(dbMock.createPostComment).toHaveBeenCalledWith(9, 11, "Thanks for sharing");

    dbMock.createPostComment.mockResolvedValueOnce(undefined);
    await expect(caller.social.addComment({ postId: 404, content: "Not found" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
