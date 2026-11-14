import { invokeLLM } from "./llm.ts";

export interface TaskSummaryRequest {
  surveyTitle: string;
  surveyDescription: string;
  surveyQuestions: string[];
  estimatedDuration: number; // in minutes
  difficulty?: "easy" | "medium" | "hard";
}

export interface TaskSummary {
  summary: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  estimatedTime: number; // in minutes
  tips: string[];
  keyPoints: string[];
}

/**
 * Summarize and explain a survey task using Manus LLM
 */
export async function summarizeSurveyTask(
  request: TaskSummaryRequest
): Promise<TaskSummary> {
  try {
    const prompt = `You are a helpful assistant that summarizes and explains survey tasks to users.

Survey Title: ${request.surveyTitle}
Survey Description: ${request.surveyDescription}
Survey Questions: ${request.surveyQuestions.join("\n")}
Estimated Duration: ${request.estimatedDuration} minutes

Please provide:
1. A brief summary (2-3 sentences) of what this survey is about
2. A clear explanation of what the user needs to do
3. The difficulty level (easy, medium, or hard)
4. The estimated time to complete (in minutes)
5. 3-4 helpful tips to complete the survey faster
6. 2-3 key points to remember

Format your response as JSON with the following structure:
{
  "summary": "...",
  "explanation": "...",
  "difficulty": "easy|medium|hard",
  "estimatedTime": number,
  "tips": ["tip1", "tip2", "tip3", "tip4"],
  "keyPoints": ["point1", "point2", "point3"]
}`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that summarizes and explains survey tasks. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== "string") {
      throw new Error("No response from LLM");
    }

    // Parse JSON response
    const jsonMatch = (content as string).match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid JSON response from LLM");
    }

    const parsed = JSON.parse(jsonMatch[0]) as TaskSummary;
    return parsed;
  } catch (error) {
    console.error("[AI Task Summarizer] Error:", error);
    throw error;
  }
}

/**
 * Generate difficulty level for a survey
 */
export async function calculateSurveyDifficulty(
  surveyTitle: string,
  surveyDescription: string,
  questionCount: number,
  estimatedDuration: number
): Promise<"easy" | "medium" | "hard"> {
  try {
    const prompt = `Based on the following survey details, determine the difficulty level:

Title: ${surveyTitle}
Description: ${surveyDescription}
Number of Questions: ${questionCount}
Estimated Duration: ${estimatedDuration} minutes

Respond with ONLY one word: "easy", "medium", or "hard"`;

    const response = await invokeLLM({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message.content;
    if (typeof content === "string") {
      const lower = content.toLowerCase().trim();
      if (lower === "easy" || lower === "medium" || lower === "hard") {
        return lower as "easy" | "medium" | "hard";
      }
    }

    // Default to medium if unclear
    return "medium";
  } catch (error) {
    console.error("[AI Difficulty Calculator] Error:", error);
    return "medium";
  }
}

/**
 * Generate recommendations for surveys
 */
export async function generateSurveyRecommendations(
  userLevel: number,
  completedSurveys: string[],
  userInterests: string[]
): Promise<string[]> {
  try {
    const prompt = `You are a survey recommendation system. Based on the user's profile, recommend 3-5 survey topics they might be interested in.

User Level: ${userLevel} (1-5, where 5 is expert)
Previously Completed Surveys: ${completedSurveys.join(", ")}
User Interests: ${userInterests.join(", ")}

Provide recommendations as a JSON array of strings. Example:
["Topic 1", "Topic 2", "Topic 3"]`;

    const response = await invokeLLM({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== "string") {
      return [];
    }

    const jsonMatch = (content as string).match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    return JSON.parse(jsonMatch[0]) as string[];
  } catch (error) {
    console.error("[AI Recommendations] Error:", error);
    return [];
  }
}

/**
 * Analyze survey responses and provide insights
 */
export async function analyzeSurveyResponses(
  surveyTitle: string,
  questions: Array<{ question: string; responses: string[] }>
): Promise<string> {
  try {
    const prompt = `Analyze the following survey responses and provide key insights:

Survey: ${surveyTitle}

${questions
  .map(
    (q) => `
Question: ${q.question}
Responses: ${q.responses.join(", ")}
`
  )
  .join("\n")}

Provide a brief analysis (2-3 paragraphs) of the survey results and any notable patterns or trends.`;

    const response = await invokeLLM({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message.content;
    return typeof content === "string" ? content : "No analysis available";
  } catch (error) {
    console.error("[AI Survey Analysis] Error:", error);
    throw error;
  }
}
