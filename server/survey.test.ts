import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMock = vi.hoisted(() => ({
  getSurveyById: vi.fn(),
  checkUserSurveyResponse: vi.fn(),
  createSurveyResponse: vi.fn(),
  addPoints: vi.fn(),
  incrementSurveyResponses: vi.fn(),
  logActivity: vi.fn(),
  getUserLevel: vi.fn(),
  getAvailableSurveysForUser: vi.fn(),
  getSurveysByLevel: vi.fn(),
  getAllCategories: vi.fn(),
  getCompletedSurveyIds: vi.fn(),
  getLevelRequirements: vi.fn(),
  recordSurveyAdView: vi.fn(),
}));

vi.mock("./db", () => dbMock);

import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 7,
    openId: "survey-test-user",
    name: "Survey Tester",
    email: "tester@example.com",
    loginMethod: "test",
    role: "user",
    totalPoints: 25,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const activeSurvey = {
  id: 22,
  title: "Product feedback",
  description: "Tell us what you think",
  categoryId: 3,
  levelRequired: 1,
  pointsReward: 40,
  estimatedTime: 5,
  questions: JSON.stringify([
    { id: 1, text: "How was your experience?", type: "radio", options: ["Good", "Bad"] },
    { id: 2, text: "Tell us more", type: "text", required: false },
  ]),
  status: "active" as const,
  targetAudience: null,
  maxResponses: null,
  currentResponses: 0,
  startDate: null,
  endDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("survey.submit", () => {
  it("requires the full 26-second ad gate", async () => {
    const caller = appRouter.createCaller(createContext());

    await expect(
      caller.survey.submit({
        surveyId: activeSurvey.id,
        answers: [{ questionId: 1, answer: "Good" }],
        adWatchedSeconds: 25,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(dbMock.createSurveyResponse).not.toHaveBeenCalled();
  });

  it("rejects incomplete required answers before writing points", async () => {
    dbMock.checkUserSurveyResponse.mockResolvedValueOnce(undefined);
    dbMock.getSurveyById.mockResolvedValueOnce(activeSurvey);
    const caller = appRouter.createCaller(createContext());

    await expect(
      caller.survey.submit({
        surveyId: activeSurvey.id,
        answers: [{ questionId: 2, answer: "Additional context" }],
        adWatchedSeconds: 26,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(dbMock.createSurveyResponse).not.toHaveBeenCalled();
    expect(dbMock.addPoints).not.toHaveBeenCalled();
  });

  it("persists valid answers and awards the survey reward once", async () => {
    dbMock.checkUserSurveyResponse.mockResolvedValueOnce(undefined);
    dbMock.getSurveyById.mockResolvedValueOnce(activeSurvey);
    dbMock.createSurveyResponse.mockResolvedValueOnce({ insertId: 1 });
    const caller = appRouter.createCaller(createContext());

    const result = await caller.survey.submit({
      surveyId: activeSurvey.id,
      answers: [{ questionId: 1, answer: "Good" }],
      adWatchedSeconds: 26,
      timeSpentSeconds: 184,
    });

    expect(result).toEqual({ success: true, pointsEarned: 40 });
    expect(dbMock.createSurveyResponse).toHaveBeenCalledWith(expect.objectContaining({
      surveyId: activeSurvey.id,
      userId: 7,
      pointsAwarded: 40,
      timeSpentSeconds: 184,
      isCompleted: true,
    }));
    expect(dbMock.incrementSurveyResponses).toHaveBeenCalledWith(activeSurvey.id);
    expect(dbMock.addPoints).toHaveBeenCalledWith(7, 40, "earned", "Completed survey: Product feedback", activeSurvey.id);
    expect(dbMock.logActivity).toHaveBeenCalledWith(7, "survey_completed", "Completed survey: Product feedback", expect.objectContaining({ adWatchedSeconds: 26 }));
  });

  it("protects a previously completed survey from duplicate rewards", async () => {
    dbMock.checkUserSurveyResponse.mockResolvedValueOnce({ pointsAwarded: 40 });
    const caller = appRouter.createCaller(createContext());

    await expect(
      caller.survey.submit({
        surveyId: activeSurvey.id,
        answers: [{ questionId: 1, answer: "Good" }],
        adWatchedSeconds: 26,
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });

    expect(dbMock.getSurveyById).not.toHaveBeenCalled();
    expect(dbMock.addPoints).not.toHaveBeenCalled();
  });
});

describe("advertisement.recordSurveyView", () => {
  it("requires at least 26 seconds before recording a view", async () => {
    dbMock.getSurveyById.mockResolvedValueOnce(activeSurvey);
    const caller = appRouter.createCaller(createContext());

    await expect(caller.advertisement.recordSurveyView({ surveyId: activeSurvey.id, adId: null, viewDuration: 25 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(dbMock.recordSurveyAdView).not.toHaveBeenCalled();
  });

  it("records a verified survey view without awarding an extra reward", async () => {
    dbMock.getSurveyById.mockResolvedValueOnce(activeSurvey);
    dbMock.recordSurveyAdView.mockResolvedValueOnce({ recorded: true, alreadyRecorded: false });
    const caller = appRouter.createCaller(createContext());

    await expect(caller.advertisement.recordSurveyView({ surveyId: activeSurvey.id, adId: 3, viewDuration: 26 })).resolves.toEqual({ recorded: true, alreadyRecorded: false });
    expect(dbMock.recordSurveyAdView).toHaveBeenCalledWith(7, activeSurvey.id, 3, 26);
  });

  it("does not record a view for an unknown survey", async () => {
    dbMock.getSurveyById.mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(createContext());

    await expect(caller.advertisement.recordSurveyView({ surveyId: 404, viewDuration: 26 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(dbMock.recordSurveyAdView).not.toHaveBeenCalled();
  });
});

describe("survey.availableForUser", () => {
  it("returns only surveys available to the user's unlocked level", async () => {
    dbMock.getUserLevel.mockResolvedValueOnce({ currentLevel: 2 });
    dbMock.getAvailableSurveysForUser.mockResolvedValueOnce([activeSurvey]);
    const caller = appRouter.createCaller(createContext());

    const result = await caller.survey.availableForUser({ limit: 50, offset: 0 });

    expect(result).toEqual([activeSurvey]);
    expect(dbMock.getAvailableSurveysForUser).toHaveBeenCalledWith(7, 50, 0);
  });

  it("does not expose a locked level through the API", async () => {
    dbMock.getUserLevel.mockResolvedValueOnce({ currentLevel: 1 });
    const caller = appRouter.createCaller(createContext());

    const result = await caller.survey.availableForUser({ level: 2, limit: 50, offset: 0 });

    expect(result).toEqual([]);
    expect(dbMock.getSurveysByLevel).not.toHaveBeenCalled();
  });
});
