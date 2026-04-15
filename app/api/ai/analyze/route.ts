import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const transcript = body.transcript || "";
    const topic = body.topic || "";
    const category = body.category || "";
    const framework = body.framework || "";
    
    // In original code this was passed as stringified JSON or plain object?
    // The frontend sends duration, wpm, pauseCount at the root and topic/transcript
    // Let's reconstruct audioMetadata as the frontend doesn't send "audioMetadata", it sends root fields.
    const audioMetadata = {
      totalDurationSeconds: body.duration || 0,
      wpm: body.wpm || 0,
      pauseCount: body.pauseCount || 0
    };

    if (!transcript || transcript.trim().length < 10) {
      return NextResponse.json(
        { error: "Transcript too short. Please speak more." },
        { status: 400 }
      );
    }

    const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;

    // Build the analysis prompt
    const prompt = buildAnalysisPrompt({
      transcript,
      topic,
      category,
      framework,
      audioMetadata,
      wordCount,
    });

    if (!GEMINI_API_KEY) {
      // Return mock data if no API key
      return NextResponse.json({
        sessionId: "mock-" + Date.now(),
        analysis: getMockAnalysis(transcript, wordCount, audioMetadata),
      });
    }

    // Call Gemini API
    const geminiResponse = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            topP: 0.8,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json({
        sessionId: "fallback-" + Date.now(),
        analysis: getMockAnalysis(transcript, wordCount, audioMetadata),
      });
    }

    const geminiData = await geminiResponse.json();
    const analysisText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch {
      console.error("Failed to parse Gemini JSON response");
      analysis = getMockAnalysis(transcript, wordCount, audioMetadata);
    }

    const sessionId = "session-" + Date.now();

    return NextResponse.json({
      sessionId,
      analysis,
      transcript,
      topic,
      audioMetadata,
    });
  } catch (error) {
    console.error("Analysis API error:", error);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}

// ---- Build the prompt ----
function buildAnalysisPrompt(params: {
  transcript: string;
  topic: string;
  category: string;
  framework: string;
  audioMetadata: Record<string, unknown>;
  wordCount: number;
}) {
  return `You are FluentMind AI, an expert English speaking coach and linguist.
Analyze this speech transcript and provide detailed feedback.

TRANSCRIPT:
"${params.transcript}"

TOPIC: "${params.topic}"
CATEGORY: ${params.category}
SUGGESTED FRAMEWORK: ${params.framework}
WORD COUNT: ${params.wordCount}
SPEAKING DURATION: ${params.audioMetadata.totalDurationSeconds || 0} seconds
WORDS PER MINUTE: ${params.audioMetadata.wpm || 0}
PAUSE COUNT: ${params.audioMetadata.pauseCount || 0}
AVERAGE PAUSE DURATION: ${params.audioMetadata.averagePauseDurationMs || 0}ms

Analyze across ALL six dimensions and return STRICTLY this JSON structure:

{
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

RULES:
1. Be encouraging, honest, and specific.
2. Scores must reflect actual performance — 90+ means genuinely excellent.
3. Flag CONTEXTUAL filler words only. "Like" as a simile is NOT a filler.
4. Include exact original and corrected text for grammar errors.
5. Evaluate which speaking framework was used and what's missing.
6. Return ONLY valid JSON, no markdown.`;
}

// ---- Mock Analysis (when no API key) ----
function getMockAnalysis(
  transcript: string,
  wordCount: number,
  audioMetadata: Record<string, unknown>
) {
  const fillerPatterns = /\b(um|uh|like|you know|basically|literally|actually|i mean|so yeah|kind of|sort of)\b/gi;
  const matches = transcript.match(fillerPatterns) || [];
  const fillerCount = matches.length;
  const clarityScore = Math.max(0, Math.min(100, 100 - (fillerCount / Math.max(wordCount, 1)) * 500));

  const fillerMap: Record<string, number> = {};
  matches.forEach((m) => {
    const key = m.toLowerCase();
    fillerMap[key] = (fillerMap[key] || 0) + 1;
  });

  const uniqueWords = new Set(transcript.toLowerCase().split(/\s+/).filter(Boolean));
  const lexicalDiversity = wordCount > 0 ? uniqueWords.size / wordCount : 0;

  return {
    clarity: {
      score: Math.round(clarityScore),
      fillerWords: Object.entries(fillerMap).map(([word, count]) => ({
        word,
        count,
      })),
      totalFillers: fillerCount,
      feedback: fillerCount === 0
        ? "Excellent! No filler words detected. Your speech was clean and clear."
        : `You used ${fillerCount} filler word${fillerCount > 1 ? "s" : ""}. Try pausing silently instead of using "${matches[0]}" — silence shows confidence.`,
    },
    vocabulary: {
      score: Math.round(Math.min(100, lexicalDiversity * 200)),
      lexicalDiversity: Math.round(lexicalDiversity * 100) / 100,
      cefrLevel: wordCount > 50 ? "B1" : "A2",
      basicWordsFlagged: [],
      advancedWordsUsed: [],
      feedback: `You used ${uniqueWords.size} unique words out of ${wordCount} total. Keep expanding your vocabulary by visiting your word bank.`,
    },
    grammar: {
      score: 75,
      errors: [],
      feedback: "Connect your Gemini API key for detailed grammar analysis. We'll catch missing articles, tense errors, and more.",
    },
    structure: {
      score: 60,
      frameworkDetected: "none",
      frameworkAdherence: {
        segments: [],
        missingElements: ["Point", "Reason", "Example"],
      },
      coherenceScore: 65,
      transitionWordsUsed: [],
      feedback: "Try using the PREP framework: make a Point, give a Reason, add an Example, then restate your Point.",
      suggestedFramework: "PREP",
    },
    fluency: {
      score: Math.min(100, Math.round(((audioMetadata.wpm as number) || 120) / 1.5)),
      wordsPerMinute: (audioMetadata.wpm as number) || 120,
      selfCorrectionCount: 0,
      ieltsBandEstimate: 6.0,
      feedback: `You spoke at approximately ${(audioMetadata.wpm as number) || 120} words per minute. Native speakers average 120-150 WPM.`,
    },
    confidence: {
      score: 70,
      hedgingPhrases: [],
      assertivePhrases: [],
      feedback: "Connect your Gemini API key for confidence analysis — we'll detect hedging language and assertive speaking patterns.",
    },
    overall: {
      score: Math.round(clarityScore * 0.7 + 30),
      summary: `Great effort! You spoke ${wordCount} words in ${(audioMetadata.totalDurationSeconds as number) || 0} seconds. ${fillerCount > 0 ? `Watch out for filler words like "${matches[0]}".` : "Your speech was clean!"} Keep practicing daily to build consistency.`,
      topStrength: fillerCount === 0 ? "Clean speech with no fillers" : "Willingness to practice",
      topWeakness: "Connect Gemini API for full analysis",
      actionableTip: "Record yourself daily for just 2 minutes. Consistency beats intensity.",
    },
  };
}
