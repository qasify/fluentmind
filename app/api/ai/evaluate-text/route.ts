import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

export async function POST(req: Request) {
  try {
    const { text, topic, category, pastContext } = await req.json();

    if (!text || text.length < 10) {
      return NextResponse.json({ error: "Text too short to evaluate." }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const prompt = `You are an expert, tough, and highly analytical American English communications coach scoring an advanced ESL learner (CEFR C1 level).
Your task is to analyze a WRITTEN response from the user.

TASK CONTEXT:
Topic: ${topic}
Category: ${category}
${pastContext ? `\nACTIVE MISTAKES LEDGER (Watch carefully if they repeat these!):\n${pastContext}` : ""}

USER'S WRITTEN RESPONSE:
"${text}"

Your analysis must be brutal, honest, and highly specific. Do not flatter. Point out unnatural phrasing, weak vocabulary, and grammatical errors. Provide C1/C2 vocabulary alternatives.

Output EXACTLY this JSON format (no markdown formatting, no backticks, just raw JSON). Ensure all string fields are properly escaped.

{
  "clarity": {
    "score": <0-100>,
    "feedback": "<2-3 sentences max>"
  },
  "vocabulary": {
    "score": <0-100>,
    "lexicalDiversity": <float>,
    "cefrLevel": "<B2|C1|C2>",
    "basicWordsFlagged": [
      {
        "original": "<basic word>",
        "context": "<the sentence where it was used>",
        "suggestions": [
          { "word": "<advanced word>", "register": "<casual|professional>", "definition": "<string>" }
        ]
      }
    ],
    "phraseUpgrades": [
      {
        "original": "<awkward phrase>",
        "suggestion": "<natural phrase>",
        "explanation": "<string>"
      }
    ],
    "advancedWordsUsed": ["<string>"],
    "feedback": "<string>"
  },
  "grammar": {
    "score": <0-100>,
    "errors": [
      { "originalText": "<string>", "correctedText": "<string>", "errorType": "<type>", "explanation": "<string>" }
    ],
    "feedback": "<string>"
  },
  "structure": {
    "score": <0-100>,
    "coherenceScore": <0-100>,
    "transitionWordsUsed": ["<string>"],
    "feedback": "<string>"
  },
  "fluency": {
    "score": <0-100>,
    "wordsPerMinute": 0,
    "selfCorrectionCount": 0,
    "ieltsBandEstimate": <float>,
    "feedback": "Evaluated based on written flow and logical progression."
  },
  "overall": {
    "score": <0-100>,
    "summary": "<3-4 sentences>",
    "topStrength": "<string>",
    "topWeakness": "<string>",
    "actionableTip": "<string>",
    "upgradedTranscript": "<Rewrite their ENTIRE text in fluent, natural native C1-level written English>",
    "newMistakesToTrack": [
      { "rule": "<Rule>", "errorType": "<grammar|vocabulary>", "exampleOriginal": "<bad>", "exampleSuggestion": "<good>" }
    ],
    "mistakesAvoided": ["<ids>"],
    "mistakesRepeated": ["<ids>"]
  }
}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const geminiData = await response.json();
    const candidateText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error("Invalid response format from Gemini API.");
    }

    const parsedAnalysis = JSON.parse(candidateText);

    return NextResponse.json({
      success: true,
      data: parsedAnalysis
    });
  } catch (error: any) {
    console.error("Text evaluation failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
