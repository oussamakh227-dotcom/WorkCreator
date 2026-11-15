/**
 * Google Maps API Integration for Manus WebDev Tools
 * 
 * Main function: makeRequest<T>(endpoint, params)
 * All credentials are automatically injected.
 * 
 * See API examples below the type definitions for usage.
 */

import { ENV } from "./env.ts";

export type MapApiCallOptions = {
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
};

export async function makeMapRequest<T = any>(endpoint: string, options: MapApiCallOptions = {}): Promise<T> {
  const apiKey = ENV.forgeApiKey || process.env.GOOGLE_MAPS_API_KEY || "";
  const baseUrl = "https://maps.googleapis.com/maps/api";
  
  const url = new URL(${baseUrl}/${endpoint});
  
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  // Inject API key automatically if not present
  if (!url.searchParams.has("key") && apiKey) {
    url.searchParams.append("key", apiKey);
  }

  const response = await fetch(url.toString(), {
    method: options.body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(Google Maps API error: ${response.statusText});
  }

  return response.json();
}
