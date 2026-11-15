/**
 * Image generation helper using Deno/LLM services
 * 
 * Example usage:
 * const { url : imageUrl } = await generateImage({
 *   prompt : "A serene landscape with mountains"
 * });
 * 
 * For editing:
 * const { url : imageUrl } = await generateImage({
 *   prompt : "Add a rainbow to this landscape",
 *   originalImages : [{
 *     url : "https://example.com/original.jpg",
 *     mimeType : "image/jpeg"
 *   }]
 * });
 */

import { storagePut } from "../storage.ts";
import { ENV } from "./env.ts";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export async function generateImage(options: GenerateImageOptions): Promise<{ url: string }> {
  // Call Image Generation API or Deno backend service
  const response = await fetch(${ENV.forgeApiUrl || "https://api.openai.com/v1"}/images/generations, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": Bearer ${ENV.forgeApiKey || ""},
    },
    body: JSON.stringify({
      prompt: options.prompt,
      n: 1,
      size: "1024x1024",
    }),
  });

  if (!response.ok) {
    throw new Error(Image generation failed: ${response.statusText});
  }

  const data = await response.json();
  const imageUrl = data.data?.[0]?.url;

  if (!imageUrl) {
    throw new Error("No image URL returned from generation service.");
  }

  return { url: imageUrl };
} rainbow to this landscape",
 *     originalImages: [{
 *       url: "https://example.com/original.jpg",
 *       mimeType: "image/jpeg"
 *     }]
 *   });
 */
import { storagePut } from "server/storage";
import { ENV } from "./env";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  if (!ENV.forgeApiUrl) {
    throw new Error("BUILT_IN_FORGE_API_URL is not configured");
  }
  if (!ENV.forgeApiKey) {
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  }

  // Build the full URL by appending the service path to the base URL
  const baseUrl = ENV.forgeApiUrl.endsWith("/")
    ? ENV.forgeApiUrl
    : `${ENV.forgeApiUrl}/`;
  const fullUrl = new URL(
    "images.v1.ImageService/GenerateImage",
    baseUrl
  ).toString();

  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "connect-protocol-version": "1",
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify({
      prompt: options.prompt,
      original_images: options.originalImages || [],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Image generation request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  const result = (await response.json()) as {
    image: {
      b64Json: string;
      mimeType: string;
    };
  };
  const base64Data = result.image.b64Json;
  const buffer = Buffer.from(base64Data, "base64");

  // Save to S3
  const { url } = await storagePut(
    `generated/${Date.now()}.png`,
    buffer,
    result.image.mimeType
  );
  return {
    url,
  };
}
