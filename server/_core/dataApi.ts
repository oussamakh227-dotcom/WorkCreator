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
