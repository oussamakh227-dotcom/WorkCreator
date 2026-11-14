/**
 * Claude AI Integration Service
 * Handles Claude API calls for survey analysis and report generation
 */

import { invokeLLM } from "./llm.ts";

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClaudeAnalysisRequest {
  surveyData: Record<string, any>;
  analysisType: "summary" | "insights" | "recommendations" | "full";
}

export interface ClaudeAnalysisResponse {
  analysis: string;
  insights: string[];
  recommendations: string[];
  confidence: number;
}

export class ClaudeIntegration {
  private apiKey: string;
  private model: string = "claude-3-opus-20240229";
  private maxTokens: number = 4096;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.CLAUDE_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("Claude API key is required");
    }
  }

  async analyzeSurvey(request: ClaudeAnalysisRequest): Promise<ClaudeAnalysisResponse> {
    const prompt = Please analyze the following survey data based on the requested analysis type (${request.analysisType}):\n\n${JSON.stringify(request.surveyData, null, 2)};

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert data analyst specializing in survey insights and strategic reporting." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    let insights: string[] = [];
    let recommendations: string[] = [];

    try {
      const parsed = typeof response === 'string' ? JSON.parse(response) : response;
      if (Array.isArray(parsed.insights)) insights = parsed.insights;
      if (Array.isArray(parsed.recommendations)) recommendations = parsed.recommendations;
    } catch (e) {
      // Fallback if not strict JSON
    }

    return {
      analysis: typeof response === 'string' ? response : JSON.stringify(response),
      insights: insights.length > 0 ? insights : ["Analysis completed"],
      recommendations: recommendations.length > 0 ? recommendations : ["Review the full analysis above"],
      confidence: 0.85,
    };
  }
}

export function createClaudeIntegration(apiKey?: string): ClaudeIntegration {
  const key = apiKey || process.env.CLAUDE_API_KEY;
  if (!key) {
    throw new Error("Claude API key is required");
  }
  return new ClaudeIntegration(key);
}
