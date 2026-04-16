import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

type Bands = {
  fluency: number;
  lexical: number;
  grammar: number;
  pronunciation: number;
  overall: number;
};

function isRateLimitLike(status: number, bodyText: string): boolean {
  const t = (bodyText || "").toLowerCase();
  return (
    status === 429 ||
    status === 503 ||
    t.includes("resource_exhausted") ||
    t.includes("quota") ||
    t.includes("rate limit") ||
    t.includes("too many requests")
  );
}

function buildRateLimitedFallback(params: {
  wpm: number;
  message: string;
  retryAfterSeconds?: number;
}) {
  return {
    rateLimited: true,
    retryAfterSeconds: params.retryAfterSeconds ?? 30,
    message: params.message,
    transcript: "",
    bands: toBands({ fluency: 0, lexical: 0, grammar: 0, pronunciation: 0, overall: 0 }),
    diagnostics: {
      fluency: "Scoring temporarily unavailable (rate limited).",
      lexical: "Scoring temporarily unavailable (rate limited).",
      grammar: "Scoring temporarily unavailable (rate limited).",
      pronunciation: "Scoring temporarily unavailable (rate limited).",
      overall: "Scoring temporarily unavailable (rate limited).",
    },
    rawAnalysis: {
      clarity: { score: 0, fillerWords: [], totalFillers: 0, feedback: "Rate limited. Please retry scoring." },
      vocabulary: { score: 0, lexicalDiversity: 0, cefrLevel: "A1", basicWordsFlagged: [], phraseUpgrades: [], advancedWordsUsed: [], feedback: "Rate limited. Please retry scoring." },
      grammar: { score: 0, errors: [], feedback: "Rate limited. Please retry scoring." },
      structure: { score: 0, frameworkDetected: "none", frameworkAdherence: { segments: [], missingElements: [] }, bestFrameworks: [], coherenceScore: 0, transitionWordsUsed: [], feedback: "Rate limited. Please retry scoring.", suggestedFramework: "PREP" },
      fluency: { score: 0, wordsPerMinute: params.wpm || 0, selfCorrectionCount: 0, ieltsBandEstimate: 0, feedback: "Rate limited. Please retry scoring." },
      confidence: { score: 0, hedgingPhrases: [], assertivePhrases: [], feedback: "Rate limited. Please retry scoring." },
      overall: {
        score: 0,
        summary: "We couldn’t score your response right now due to temporary rate limits. Your recording is safe — please retry in a moment.",
        topStrength: "",
        topWeakness: "",
        actionableTip: "Retry scoring in ~30 seconds.",
        nativeVersion: "",
        upgradedTranscript: "",
        newMistakesToTrack: [],
        mistakesAvoided: [],
        mistakesRepeated: [],
      },
    },
  };
}

function clampBand(x: number): number {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(9, Math.round(x * 2) / 2));
}

function toBands(obj: any): Bands {
  return {
    fluency: clampBand(Number(obj?.fluency ?? 0)),
    lexical: clampBand(Number(obj?.lexical ?? 0)),
    grammar: clampBand(Number(obj?.grammar ?? 0)),
    pronunciation: clampBand(Number(obj?.pronunciation ?? 0)),
    overall: clampBand(Number(obj?.overall ?? 0)),
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    const examType = (formData.get("examType") as string) || "ielts_speaking";
    const part = Number(formData.get("part") || 1);
    const prompt = (formData.get("prompt") as string) || "";
    const title = (formData.get("title") as string) || "";
    const duration = Number(formData.get("duration") || 0);
    const wpm = Number(formData.get("wpm") || 0);
    const pauseCount = Number(formData.get("pauseCount") || 0);
    const eloRating = Number(formData.get("eloRating") || 1200);
    const aiPersonality = (formData.get("aiPersonality") as string) || "strict_examiner";

    if (!audioFile || audioFile.size < 1000) {
      return NextResponse.json({ error: "Audio too short or missing." }, { status: 400 });
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    const system = `You are FluentMind AI acting as an IELTS Speaking examiner.

EXAM CONTEXT:
- examType: ${examType}
- part: ${part}
- stepTitle: ${title}
- prompt: ${prompt}
- durationSeconds: ${duration}
- estimatedWPM: ${wpm}
- pauseCount: ${pauseCount}
- adaptiveEloRating: ${eloRating}
- personaStyle: ${aiPersonality}

TASK:
1) TRANSCRIBE the audio accurately.
2) SCORE this response like IELTS: Fluency&Coherence, Lexical Resource, Grammar, Pronunciation.
3) Return BOTH:
   - bands (0.0-9.0 in 0.5 increments)
   - a rawAnalysis compatible with the existing SessionAnalysis shape.

Return ONLY valid JSON in this format:
{
  "transcript": "string",
  "bands": { "fluency": 0, "lexical": 0, "grammar": 0, "pronunciation": 0, "overall": 0 },
  "diagnostics": {
    "fluency": "string",
    "lexical": "string",
    "grammar": "string",
    "pronunciation": "string",
    "overall": "string"
  },
  "rawAnalysis": {
    "clarity": { "score": 0, "fillerWords": [{"word":"string","count":0}], "totalFillers": 0, "feedback": "string" },
    "vocabulary": {
      "score": 0,
      "lexicalDiversity": 0.0,
      "cefrLevel": "A1",
      "basicWordsFlagged": [
        {
          "original": "string",
          "context": "string",
          "suggestions": [
            {
              "word": "string",
              "register": "casual|professional|academic",
              "definition": "string",
              "pronunciation": "string"
            }
          ]
        }
      ],
      "phraseUpgrades": [
        {
          "original": "string",
          "suggestion": "string",
          "explanation": "string"
        }
      ],
      "advancedWordsUsed": ["string"],
      "feedback": "string"
    },
    "grammar": {
      "score": 0,
      "errors": [
        {
          "originalText": "string",
          "correctedText": "string",
          "errorType": "string",
          "explanation": "string"
        }
      ],
      "feedback": "string"
    },
    "structure": { "score": 0, "frameworkDetected": "none", "frameworkAdherence": { "segments": [], "missingElements": [] }, "bestFrameworks": [], "coherenceScore": 0, "transitionWordsUsed": [], "feedback": "string", "suggestedFramework": "string" },
    "fluency": { "score": 0, "wordsPerMinute": 0, "selfCorrectionCount": 0, "ieltsBandEstimate": 0, "feedback": "string" },
    "confidence": { "score": 0, "hedgingPhrases": [], "assertivePhrases": [], "feedback": "string" },
    "overall": {
      "score": 0,
      "summary": "string",
      "topStrength": "string",
      "topWeakness": "string",
      "actionableTip": "string",
      "nativeVersion": "string",
      "upgradedTranscript": "string",
      "newMistakesToTrack": [],
      "mistakesAvoided": [],
      "mistakesRepeated": []
    }
  }
}`;

    if (!GEMINI_API_KEY) {
      const mockBands = toBands({ fluency: 6, lexical: 6, grammar: 6, pronunciation: 6, overall: 6 });
      return NextResponse.json({
        transcript: "(Mock transcript — connect GEMINI_API_KEY)",
        bands: mockBands,
        diagnostics: {
          fluency: "Mock fluency diagnostic.",
          lexical: "Mock lexical diagnostic.",
          grammar: "Mock grammar diagnostic.",
          pronunciation: "Mock pronunciation diagnostic.",
          overall: "Mock overall diagnostic.",
        },
        rawAnalysis: {
          clarity: { score: 60, fillerWords: [], totalFillers: 0, feedback: "Mock clarity feedback." },
          vocabulary: { score: 60, lexicalDiversity: 0.5, cefrLevel: "B1", basicWordsFlagged: [], phraseUpgrades: [], advancedWordsUsed: [], feedback: "Mock vocab feedback." },
          grammar: { score: 60, errors: [], feedback: "Mock grammar feedback." },
          structure: { score: 60, frameworkDetected: "none", frameworkAdherence: { segments: [], missingElements: [] }, bestFrameworks: [], coherenceScore: 60, transitionWordsUsed: [], feedback: "Mock structure feedback.", suggestedFramework: "PREP" },
          fluency: { score: 60, wordsPerMinute: wpm || 110, selfCorrectionCount: 0, ieltsBandEstimate: mockBands.overall, feedback: "Mock fluency feedback." },
          confidence: { score: 60, hedgingPhrases: [], assertivePhrases: [], feedback: "Mock confidence feedback." },
          overall: {
            score: 60,
            summary: "Mock summary.",
            topStrength: "Mock strength.",
            topWeakness: "Mock weakness.",
            actionableTip: "Mock actionable tip.",
            nativeVersion: "(Mock)",
            upgradedTranscript: "(Mock)",
            newMistakesToTrack: [],
            mistakesAvoided: [],
            mistakesRepeated: [],
          },
        },
      });
    }

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: "audio/webm",
                  data: base64Audio,
                },
              },
              { text: system },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      if (isRateLimitLike(geminiResponse.status, errorText)) {
        return NextResponse.json(
          buildRateLimitedFallback({
            wpm,
            message: "Gemini is temporarily rate-limited. Please retry scoring in a moment.",
            retryAfterSeconds: 30,
          }),
          { status: 200 }
        );
      }
      return NextResponse.json({ error: `Gemini API error: ${geminiResponse.status} - ${errorText}` }, { status: 500 });
    }

    const geminiData = await geminiResponse.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Sometimes model returns a non-JSON string during overload; treat as retryable.
      return NextResponse.json(
        buildRateLimitedFallback({
          wpm,
          message: "Temporary overload while scoring. Please retry in a moment.",
          retryAfterSeconds: 20,
        }),
        { status: 200 }
      );
    }

    return NextResponse.json({
      rateLimited: false,
      transcript: parsed.transcript || "",
      bands: toBands(parsed.bands),
      diagnostics: parsed.diagnostics || {},
      rawAnalysis: parsed.rawAnalysis || parsed.analysis || parsed,
    });
  } catch (error: any) {
    console.error("Exam analyze API error:", error);
    // Network/transient errors: prefer retryable response so UI can handle gracefully.
    return NextResponse.json(
      buildRateLimitedFallback({
        wpm: 0,
        message: "Temporary scoring issue. Please retry in a moment.",
        retryAfterSeconds: 20,
      }),
      { status: 200 }
    );
  }
}

