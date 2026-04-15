import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const topic = (formData.get("topic") as string) || "";
    const category = (formData.get("category") as string) || "";
    const framework = (formData.get("framework") as string) || "";
    const duration = Number(formData.get("duration") || 0);
    const wpm = Number(formData.get("wpm") || 0);
    const pauseCount = Number(formData.get("pauseCount") || 0);

    if (!audioFile || audioFile.size < 1000) {
      return NextResponse.json(
        { error: "Audio too short or missing. Please speak more." },
        { status: 400 }
      );
    }

    // Convert audio file to base64 for Gemini inline_data
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    const prompt = buildAnalysisPrompt({ topic, category, framework, duration, wpm, pauseCount });

    if (!GEMINI_API_KEY) {
      // No API key — return mock data
      return NextResponse.json({
        sessionId: "mock-" + Date.now(),
        analysis: getMockAnalysis(duration, wpm),
        transcript: "(Mock transcript — connect Gemini API key for real transcription)",
      });
    }

    // Call Gemini with audio + prompt (multimodal)
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
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json({
        sessionId: "fallback-" + Date.now(),
        analysis: getMockAnalysis(duration, wpm),
        transcript: "(Fallback — Gemini API returned an error)",
      });
    }

    const geminiData = await geminiResponse.json();
    const analysisText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let parsed;
    try {
      parsed = JSON.parse(analysisText);
    } catch {
      console.error("Failed to parse Gemini JSON response:", analysisText.slice(0, 200));
      return NextResponse.json({
        sessionId: "fallback-" + Date.now(),
        analysis: getMockAnalysis(duration, wpm),
        transcript: "(Fallback — failed to parse Gemini response)",
      });
    }

    // Gemini returns { transcript, analysis } (see prompt)
    const sessionId = "session-" + Date.now();

    return NextResponse.json({
      sessionId,
      transcript: parsed.transcript || "",
      analysis: parsed.analysis || parsed,
      topic,
    });
  } catch (error) {
    console.error("Analysis API error:", error);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}

// ---- Build the prompt (no transcript needed — Gemini listens to the audio) ----
function buildAnalysisPrompt(params: {
  topic: string;
  category: string;
  framework: string;
  duration: number;
  wpm: number;
  pauseCount: number;
}) {
  return `You are FluentMind AI, an expert English speaking coach and linguist.
You will receive an audio recording of a speaker practicing English.

TASK:
1. First, TRANSCRIBE the audio accurately with proper punctuation and capitalization.
2. Then, ANALYZE the speech across all six dimensions below.

TOPIC: "${params.topic}"
CATEGORY: ${params.category}
SUGGESTED FRAMEWORK: ${params.framework}
SPEAKING DURATION: ${params.duration} seconds
ESTIMATED WPM: ${params.wpm}
PAUSE COUNT: ${params.pauseCount}

Return STRICTLY this JSON structure (no markdown, no extra text):

{
  "transcript": "<accurate transcription of the audio with proper punctuation>",
  "analysis": {
    "clarity": {
      "score": <0-100>,
      "fillerWords": [{"word": "<string>", "count": <int>}],
      "totalFillers": <int>,
      "feedback": "<2-3 sentences>"
    },
    "vocabulary": {
      "score": <0-100>,
      "lexicalDiversity": <float>,
      "cefrLevel": "<A1-C2>",
      "basicWordsFlagged": [
        {
          "original": "<string>",
          "context": "<surrounding sentence>",
          "suggestions": [
            {"word": "<string>", "register": "<casual|professional|academic>", "definition": "<string>"}
          ]
        }
      ],
      "advancedWordsUsed": ["<string>"],
      "feedback": "<2-3 sentences>"
    },
    "grammar": {
      "score": <0-100>,
      "errors": [
        {
          "originalText": "<string>",
          "correctedText": "<string>",
          "errorType": "<article|tense|agreement|preposition|word_order|other>",
          "explanation": "<string>"
        }
      ],
      "feedback": "<2-3 sentences>"
    },
    "structure": {
      "score": <0-100>,
      "frameworkDetected": "<PREP|STAR|AAA|PEE|none>",
      "frameworkAdherence": {
        "segments": [{"label": "<string>", "present": <bool>}],
        "missingElements": ["<string>"]
      },
      "coherenceScore": <0-100>,
      "transitionWordsUsed": ["<string>"],
      "feedback": "<2-3 sentences>",
      "suggestedFramework": "<string>"
    },
    "fluency": {
      "score": <0-100>,
      "wordsPerMinute": <float>,
      "selfCorrectionCount": <int>,
      "ieltsBandEstimate": <float>,
      "feedback": "<2-3 sentences>"
    },
    "confidence": {
      "score": <0-100>,
      "hedgingPhrases": ["<string>"],
      "assertivePhrases": ["<string>"],
      "feedback": "<2-3 sentences>"
    },
    "overall": {
      "score": <0-100>,
      "summary": "<3-4 sentence encouraging summary>",
      "topStrength": "<string>",
      "topWeakness": "<string>",
      "actionableTip": "<ONE specific thing to practice next>"
    }
  }
}

RULES:
1. TRANSCRIBE the audio first — include exactly what was said, with proper punctuation and capitalization.
2. Be encouraging, honest, and specific in feedback.
3. Scores must reflect actual performance — 90+ means genuinely excellent.
4. Detect filler words ("um", "uh", "like", "you know", etc.) from the AUDIO, not just text patterns.
5. Listen for pauses, hesitations, and self-corrections in the audio.
6. Include exact original and corrected text for grammar errors.
7. Evaluate which speaking framework was used and what's missing.
8. Return ONLY valid JSON, no markdown.`;
}

// ---- Mock Analysis (when no API key) ----
function getMockAnalysis(duration: number, wpm: number) {
  return {
    clarity: {
      score: 72,
      fillerWords: [{ word: "um", count: 2 }],
      totalFillers: 2,
      feedback:
        "Your speech was mostly clear but had a few filler words. Try pausing silently instead — silence shows confidence.",
    },
    vocabulary: {
      score: 65,
      lexicalDiversity: 0.6,
      cefrLevel: "B1",
      basicWordsFlagged: [],
      advancedWordsUsed: [],
      feedback:
        "Your vocabulary is functional. Keep expanding by visiting your word bank after each session.",
    },
    grammar: {
      score: 70,
      errors: [],
      feedback:
        "Connect your Gemini API key for detailed grammar analysis. We'll catch missing articles, tense errors, and more.",
    },
    structure: {
      score: 55,
      frameworkDetected: "none",
      frameworkAdherence: {
        segments: [],
        missingElements: ["Point", "Reason", "Example"],
      },
      coherenceScore: 60,
      transitionWordsUsed: [],
      feedback:
        "Try using the PREP framework: make a Point, give a Reason, add an Example, then restate your Point.",
      suggestedFramework: "PREP",
    },
    fluency: {
      score: Math.min(100, Math.round((wpm || 120) / 1.5)),
      wordsPerMinute: wpm || 120,
      selfCorrectionCount: 0,
      ieltsBandEstimate: 6.0,
      feedback: `You spoke at approximately ${wpm || 120} words per minute. Native speakers average 120-150 WPM.`,
    },
    confidence: {
      score: 68,
      hedgingPhrases: [],
      assertivePhrases: [],
      feedback:
        "Connect your Gemini API key for confidence analysis — we'll detect hedging language and assertive speaking patterns.",
    },
    overall: {
      score: 65,
      summary: `You spoke for ${duration} seconds. Great effort! Keep practicing daily to build consistency and fluency.`,
      topStrength: "Willingness to practice",
      topWeakness: "Connect Gemini API for full analysis",
      actionableTip:
        "Record yourself daily for just 2 minutes. Consistency beats intensity.",
    },
  };
}
