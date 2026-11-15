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
00:27
Kha
import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;
  
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (forwardedProto) {
    const protos = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
    if (protos.some((p) => p.trim() === "https")) return true;
  }

  const host = req.headers.host?.split(":")[0];
  if (!host) return false;

  if (LOCAL_HOSTS.has(host) || isIpAddress(host)) {
    return false;
  }

  return true;
}

export function getSessionCookieOptions(req: Request): CookieOptions {
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
  };
}
Kha
/**
 * Quick example (matches curl usage):
 * await callDataApi("Youtube/search", {
 *   query: { gl: "US", hl: "en", q: "manus" },
 * })
 */

import { ENV } from "./env.ts";

export type DataApiCallOptions = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  formData?: Record<string, unknown>;
};

export async function callDataApi(endpoint: string, options: DataApiCallOptions = {}) {
  // Add implementation details or fetch wrapper here as required by Deno
  const baseUrl = ENV.BASE_URL || "";
  const url = new URL(endpoint, baseUrl);

  if (options.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    method: options.body || options.formData ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(DataApi error: ${response.statusText});
  }

  return response.json();
}
Kha
export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
01:01
Kha
/**
 * GitHub Integration Service
 * Handles GitHub OAuth and repository management
 */

export interface GitHubConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
}

export class GitHubIntegration {
  private config: GitHubConfig;

  constructor(config?: Partial<GitHubConfig>) {
    this.config = {
      clientId: config?.clientId || process.env.GITHUB_CLIENT_ID || "",
      clientSecret: config?.clientSecret || process.env.GITHUB_CLIENT_SECRET || "",
      redirectUri: config?.redirectUri || process.env.GITHUB_REDIRECT_URI || "",
    };
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: "repo user",
      state,
    });
    return https://github.com/login/oauth/authorize?${params.toString()};
  }

  async exchangeCodeForToken(code: string): Promise<string> {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: this.config.redirectUri,
      }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(GitHub OAuth error: ${data.error_description || data.error});
    }
    return data.access_token;
  }

  async getUser(accessToken: string): Promise<GitHubUser> {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: Bearer ${accessToken},
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(Failed to fetch GitHub user: ${response.statusText});
    }
    return response.json();
  }

  async listRepos(accessToken: string): Promise<GitHubRepo[]> {
    const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
      headers: {
        Authorization: Bearer ${accessToken},
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(Failed to fetch GitHub repos: ${response.statusText});
    }
    return response.json();
  }
}

export function createGitHubIntegration(config?: Partial<GitHubConfig>): GitHubIntegration {
  return new GitHubIntegration(config);
}
