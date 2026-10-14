/**
 * Claude AI Integration Service
 * Handles Claude API calls for survey analysis and report generation
 */

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

interface ClaudeAnalysisRequest {
  surveyData: Record<string, any>;
  analysisType: "summary" | "insights" | "recommendations" | "full";
}

interface ClaudeAnalysisResponse {
  analysis: string;
  insights: string[];
  recommendations: string[];
  confidence: number;
}

export class ClaudeIntegration {
  private apiKey: string;
  private model: string = "claude-3-opus-20240229";
  private maxTokens: number = 4096;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Claude API key is required");
    }
    this.apiKey = apiKey;
  }

  /**
   * Set the Claude model to use
   */
  setModel(model: string): void {
    this.model = model;
  }

  /**
   * Set maximum tokens for responses
   */
  setMaxTokens(maxTokens: number): void {
    this.maxTokens = maxTokens;
  }

  /**
   * Send a message to Claude and get a response
   */
  async sendMessage(messages: ClaudeMessage[]): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Claude API error: ${error.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    return data.content[0]?.text || "";
  }

  /**
   * Analyze survey responses
   */
  async analyzeSurvey(request: ClaudeAnalysisRequest): Promise<ClaudeAnalysisResponse> {
    const prompt = this.buildAnalysisPrompt(request);

    const response = await this.sendMessage([
      {
        role: "user",
        content: prompt,
      },
    ]);

    return this.parseAnalysisResponse(response);
  }

  /**
   * Generate a summary report
   */
  async generateSummaryReport(surveyData: Record<string, any>): Promise<string> {
    const prompt = `
Please analyze the following survey data and provide a comprehensive summary report:

Survey Data:
${JSON.stringify(surveyData, null, 2)}

Please provide:
1. Executive Summary
2. Key Findings
3. Response Distribution
4. Notable Trends
5. Recommendations for Action

Format the response in a professional report style.
    `;

    return this.sendMessage([
      {
        role: "user",
        content: prompt,
      },
    ]);
  }

  /**
   * Generate insights from survey data
   */
  async generateInsights(surveyData: Record<string, any>): Promise<string[]> {
    const prompt = `
Analyze the following survey data and provide 5-10 key insights:

Survey Data:
${JSON.stringify(surveyData, null, 2)}

For each insight, provide:
- A clear statement of the insight
- Supporting data or evidence
- Potential implications

Format as a JSON array of insight objects.
    `;

    const response = await this.sendMessage([
      {
        role: "user",
        content: prompt,
      },
    ]);

    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const insights = JSON.parse(jsonMatch[0]);
        return insights.map((insight: any) => insight.statement || JSON.stringify(insight));
      }
    } catch (error) {
      console.error("Failed to parse insights JSON:", error);
    }

    return [response];
  }

  /**
   * Generate recommendations based on survey data
   */
  async generateRecommendations(surveyData: Record<string, any>): Promise<string[]> {
    const prompt = `
Based on the following survey data, provide actionable recommendations:

Survey Data:
${JSON.stringify(surveyData, null, 2)}

Provide 5-10 specific, actionable recommendations that:
- Are based on the survey findings
- Are practical to implement
- Have clear potential impact
- Include priority level (high/medium/low)

Format as a JSON array of recommendation objects.
    `;

    const response = await this.sendMessage([
      {
        role: "user",
        content: prompt,
      },
    ]);

    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0]);
        return recommendations.map(
          (rec: any) => `[${rec.priority || "MEDIUM"}] ${rec.recommendation || JSON.stringify(rec)}`
        );
      }
    } catch (error) {
      console.error("Failed to parse recommendations JSON:", error);
    }

    return [response];
  }

  /**
   * Detect sentiment in survey responses
   */
  async detectSentiment(text: string): Promise<{
    sentiment: "positive" | "negative" | "neutral";
    score: number;
    explanation: string;
  }> {
    const prompt = `
Analyze the sentiment of the following text:

"${text}"

Respond with a JSON object containing:
- sentiment: "positive", "negative", or "neutral"
- score: a number between -1 (very negative) and 1 (very positive)
- explanation: a brief explanation of the sentiment

Format as JSON only.
    `;

    const response = await this.sendMessage([
      {
        role: "user",
        content: prompt,
      },
    ]);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error("Failed to parse sentiment JSON:", error);
    }

    return {
      sentiment: "neutral",
      score: 0,
      explanation: "Unable to parse response",
    };
  }

  /**
   * Build analysis prompt
   */
  private buildAnalysisPrompt(request: ClaudeAnalysisRequest): string {
    const basePrompt = `
Analyze the following survey data:

${JSON.stringify(request.surveyData, null, 2)}
    `;

    switch (request.analysisType) {
      case "summary":
        return (
          basePrompt +
          `
Please provide a concise summary of the survey results, including:
- Total responses
- Key statistics
- Main themes
        `
        );

      case "insights":
        return (
          basePrompt +
          `
Please identify and explain the most important insights from this survey data.
        `
        );

      case "recommendations":
        return (
          basePrompt +
          `
Based on these survey results, provide actionable recommendations.
        `
        );

      case "full":
        return (
          basePrompt +
          `
Please provide a comprehensive analysis including:
1. Summary of results
2. Key insights
3. Actionable recommendations
4. Potential next steps
        `
        );

      default:
        return basePrompt;
    }
  }

  /**
   * Parse analysis response
   */
  private parseAnalysisResponse(response: string): ClaudeAnalysisResponse {
    // Extract insights and recommendations from the response
    const insights: string[] = [];
    const recommendations: string[] = [];

    // Simple parsing - in production, use more sophisticated parsing
    const lines = response.split("\n");
    let currentSection = "";

    for (const line of lines) {
      if (line.toLowerCase().includes("insight")) {
        currentSection = "insights";
      } else if (line.toLowerCase().includes("recommendation")) {
        currentSection = "recommendations";
      } else if (line.trim().startsWith("-") || line.trim().startsWith("•")) {
        const content = line.replace(/^[-•]\s*/, "").trim();
        if (currentSection === "insights" && content) {
          insights.push(content);
        } else if (currentSection === "recommendations" && content) {
          recommendations.push(content);
        }
      }
    }

    return {
      analysis: response,
      insights: insights.length > 0 ? insights : ["Analysis completed"],
      recommendations:
        recommendations.length > 0 ? recommendations : ["Review the full analysis above"],
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
