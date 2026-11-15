import { ENV } from "./env.ts";

export type Role = "system" | "user" | "assistant";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "low" | "high" | "auto";
  };
};

export type ContentPart = TextContent | ImageContent;

export type Message = {
  role: Role;
  content: string | ContentPart[];
};

export type InvokeLLMOptions = {
  messages: Message[];
  response_format?: { type: "json_object" | "text" };
  temperature?: number;
  max_tokens?: number;
};

export async function invokeLLM(options: InvokeLLMOptions): Promise<string | any> {
  const apiKey = ENV.forgeApiKey || process.env.OPENAI_API_KEY || "";
  const baseUrl = ENV.forgeApiUrl || "https://api.openai.com/v1";

  const response = await fetch(${baseUrl}/chat/completions, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": Bearer ${apiKey},
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: options.messages,
      response_format: options.response_format,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 2048,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(LLM API error (${response.status}): ${errorText});
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (options.response_format?.type === "json_object" && typeof content === "string") {
    try {
      return JSON.parse(content);
    } catch (e) {
      return content;
    }
  }

  return content;
}
