import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const scenarioId = formData.get("scenarioId") as string || "";
    const scenarioTitle = formData.get("scenarioTitle") as string || "";
    const userMessage = formData.get("userMessage") as string || "";
    let messageHistory: any[] = [];
    
    try {
      messageHistory = JSON.parse((formData.get("messageHistory") as string) || "[]");
    } catch {}

    const audioFile = formData.get("audio") as File | null;

    if (!userMessage && !audioFile) {
      return NextResponse.json({ error: "Missing message or audio" }, { status: 400 });
    }

    if (!apiKey || apiKey === "mock-key-for-development") {
      return NextResponse.json({
        transcript: userMessage || "Mock transcribed audio",
        dialogue: `(Mock Mode) This is a simulation for scenario: ${scenarioTitle}. You said: "${userMessage}". How can I help?`,
        corrections: []
      });
    }

    let base64Audio = null;
    if (audioFile && audioFile.size > 0) {
      const arrayBuffer = await audioFile.arrayBuffer();
      base64Audio = Buffer.from(arrayBuffer).toString("base64");
    }

    const formatHistory = messageHistory.map((m: any) => `${m.role.toUpperCase()}: ${m.text}`).join("\n");

    const prompt = `You are a conversational AI partner acting in a roleplay. 
SCENARIO: ${scenarioTitle} (${scenarioId})

You have three jobs:
1. ${base64Audio ? "TRANSCRIBE the provided audio file exactly" : "Acknowledge the system message"}. 
2. Respond to the user naturally, IN CHARACTER, keeping the conversation flowing. Ask a question back if appropriate to keep them talking. Keep responses to 2-4 sentences max.
3. Secretly analyze the user's utterance for grammar, vocabulary, or phrasing mistakes. Provide a correction if they made a notable linguistic mistake. DO NOT include corrections directly in the dialogue.

PAST CONVERSATION:
${formatHistory || "(No history yet)"}

${userMessage ? `USER TEXT / SYSTEM COMMAND:\n"${userMessage}"` : "USER AUDIO: (Attached)"}

Respond in EXACTLY this JSON format (no markdown):
{
  "transcript": "<What the user explicitly said in the audio. If it was a [SYSTEM] command, leave blank.>",
  "dialogue": "<Your in-character spoken response>",
  "corrections": [
    {
      "original": "<the exact wrong words they used>",
      "suggestion": "<the correct or natural native way to say it>",
      "rule": "<A short 1-sentence teacher explanation of *why* it's wrong>"
    }
  ]
}

Note: If the user's message was perfectly fine, return an empty array [] for corrections.
`;

    const parts: any[] = [];
    if (base64Audio) {
      parts.push({
        inline_data: {
          mime_type: "audio/webm",
          data: base64Audio,
        },
      });
    }
    parts.push({ text: prompt });

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts
          }
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
    }

    const resultData = await response.json();
    const responseText = resultData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    try {
      const parsed = JSON.parse(responseText.trim());
      return NextResponse.json(parsed);
    } catch (e) {
      console.error("AI parse error:", responseText);
      return NextResponse.json({
        dialogue: "I didn't quite catch that. Can you repeat?",
        corrections: []
      });
    }
  } catch (error: any) {
    console.error("Failed to generate chat:", error);
    return NextResponse.json({ error: "Failed to generate chat", details: error?.message }, { status: 500 });
  }
}
