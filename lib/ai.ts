/**
 * Shared AI Client — Single utility for all Gemini API calls.
 * Routes build their prompts, then call this with the prompt + optional audio.
 * To swap providers (e.g. Groq), only this file needs to change.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODAL || "gemini-flash-latest";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface AiCallOptions {
  /** The text prompt to send */
  prompt: string;
  /** Optional base64-encoded audio data */
  audio?: string;
  /** MIME type of the audio (default: audio/webm) */
  audioMimeType?: string;
  /** Temperature for generation (default: 0.4) */
  temperature?: number;
  /** Max output tokens (default: 8192) */
  maxOutputTokens?: number;
  /** Top-P sampling (default: 0.8) */
  topP?: number;
  /** Force JSON output (default: true) */
  jsonMode?: boolean;
}

export interface AiCallResult {
  success: boolean;
  text: string;
  parsed: any | null;
  error?: string;
  rateLimited?: boolean;
}

/**
 * Call the AI model with a prompt and optional audio.
 * Returns parsed JSON if possible, raw text otherwise.
 */
export async function callAI(options: AiCallOptions): Promise<AiCallResult> {
  const {
    prompt,
    audio,
    audioMimeType = "audio/webm",
    temperature = 0.4,
    maxOutputTokens = 8192,
    topP = 0.8,
    jsonMode = true,
  } = options;

  if (!GEMINI_API_KEY || GEMINI_API_KEY === "mock-key-for-development") {
    return {
      success: false,
      text: "",
      parsed: null,
      error: "GEMINI_API_KEY is not configured.",
    };
  }

  // Build parts array
  const parts: any[] = [];
  if (audio) {
    parts.push({
      inline_data: {
        mime_type: audioMimeType,
        data: audio,
      },
    });
  }
  parts.push({ text: prompt });

  // Call Gemini
  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature,
        topP,
        maxOutputTokens,
        ...(jsonMode ? { responseMimeType: "application/json" } : {}),
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const rateLimited = response.status === 429 || errorText.includes("RESOURCE_EXHAUSTED");
    console.error("AI API error:", errorText);
    return {
      success: false,
      text: errorText,
      parsed: null,
      error: `AI API Error (${response.status})`,
      rateLimited,
    };
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Attempt JSON parse
  let parsed = null;
  try {
    parsed = JSON.parse(rawText.trim());
  } catch {
    // Not valid JSON — return raw text
  }

  return {
    success: true,
    text: rawText,
    parsed,
  };
}
