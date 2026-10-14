/**
 * GitHub Integration Service
 * Handles GitHub OAuth and repository management
 */

interface GitHubConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface GitHubUser {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
  bio: string;
}

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  url: string;
  language: string;
  stars: number;
  forks: number;
}

export class GitHubIntegration {
  private config: GitHubConfig;

  constructor(config: GitHubConfig) {
    this.config = config;
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: "repo,user",
      state,
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
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
      throw new Error(`GitHub OAuth error: ${data.error_description}`);
    }

    return data.access_token;
  }

  /**
   * Get authenticated user information
   */
  async getUser(accessToken: string): Promise<GitHubUser> {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch GitHub user");
    }

    return response.json();
  }

  /**
   * Get user repositories
   */
  async getRepositories(accessToken: string): Promise<GitHubRepository[]> {
    const response = await fetch("https://api.github.com/user/repos", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch GitHub repositories");
    }

    const repos = await response.json();
    return repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
    }));
  }

  /**
   * Get repository details
   */
  async getRepository(
    accessToken: string,
    owner: string,
    repo: string
  ): Promise<GitHubRepository> {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch GitHub repository");
    }

    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      full_name: data.full_name,
      description: data.description,
      url: data.html_url,
      language: data.language,
      stars: data.stargazers_count,
      forks: data.forks_count,
    };
  }

  /**
   * Get latest commits
   */
  async getLatestCommits(
    accessToken: string,
    owner: string,
    repo: string,
    limit: number = 10
  ) {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch commits");
    }

    const commits = await response.json();
    return commits.map((commit: any) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author.name,
      date: commit.commit.author.date,
      url: commit.html_url,
    }));
  }

  /**
   * Create a webhook for repository events
   */
  async createWebhook(
    accessToken: string,
    owner: string,
    repo: string,
    webhookUrl: string
  ) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/hooks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "web",
        active: true,
        events: ["push", "pull_request", "issues"],
        config: {
          url: webhookUrl,
          content_type: "json",
          insecure_ssl: "0",
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create webhook");
    }

    return response.json();
  }
}

export function createGitHubIntegration(): GitHubIntegration {
  const config: GitHubConfig = {
    clientId: process.env.GITHUB_CLIENT_ID || "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    redirectUri: process.env.GITHUB_REDIRECT_URI || "",
  };

  if (!config.clientId || !config.clientSecret) {
    throw new Error("GitHub integration not configured");
  }

  return new GitHubIntegration(config);
}
