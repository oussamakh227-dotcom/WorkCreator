import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  summarizeSurveyTask,
  calculateSurveyDifficulty,
  generateSurveyRecommendations,
  analyzeSurveyResponses,
} from "../_core/aiTaskSummarizer";

export const aiSummarizerRouter = router({
  summarizeTask: publicProcedure
    .input(
      z.object({
        surveyTitle: z.string(),
        surveyDescription: z.string(),
        surveyQuestions: z.array(z.string()),
        estimatedDuration: z.number().positive(),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await summarizeSurveyTask(input);
    }),

  calculateDifficulty: publicProcedure
    .input(
      z.object({
        surveyTitle: z.string(),
        surveyDescription: z.string(),
        questionCount: z.number().positive(),
        estimatedDuration: z.number().positive(),
      })
    )
    .query(async ({ input }) => {
      return await calculateSurveyDifficulty(
        input.surveyTitle,
        input.surveyDescription,
        input.questionCount,
        input.estimatedDuration
      );
    }),

  getRecommendations: publicProcedure
    .input(
      z.object({
        userLevel: z.number().min(1).max(5),
        completedSurveys: z.array(z.string()),
        userInterests: z.array(z.string()),
      })
    )
    .query(async ({ input }) => {
      return await generateSurveyRecommendations(
        input.userLevel,
        input.completedSurveys,
        input.userInterests
      );
    }),

  analyzeResponses: publicProcedure
    .input(
      z.object({
        surveyTitle: z.string(),
        questions: z.array(
          z.object({
            question: z.string(),
            responses: z.array(z.string()),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      return await analyzeSurveyResponses(input.surveyTitle, input.questions);
    }),
});
