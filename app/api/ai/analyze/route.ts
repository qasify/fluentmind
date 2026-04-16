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
    const pastContext = (formData.get("pastContext") as string) || "";
    const eloRating = Number(formData.get("eloRating") || 1200);
    const aiPersonality = (formData.get("aiPersonality") as string) || "encouraging_coach";

    if (!audioFile || audioFile.size < 1000) {
      return NextResponse.json(
        { error: "Audio too short or missing. Please speak more." },
        { status: 400 }
      );
    }

    // Convert audio file to base64 for Gemini inline_data
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    const prompt = buildAnalysisPrompt({ topic, category, framework, duration, wpm, pauseCount, pastContext, eloRating, aiPersonality });

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
          maxOutputTokens: 8192,
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
  pastContext: string;
  eloRating: number;
  aiPersonality: string;
}) {
  return `You are FluentMind AI, a strict but encouraging IELTS / CEFR English speaking examiner and linguist.
You will receive an audio recording of a speaker practicing English.

TASK:
1. TRANSCRIBE the audio accurately with proper punctuation and capitalization.
2. ANALYZE the speech across all six dimensions using STRICT, REALISTIC scoring.
3. Provide a NATIVE SPEAKER VERSION and an UPGRADED version of the speaker's transcript.
4. Review the strictly provided PAST CONTEXT (their previous mistakes). You MUST explicitly point out if they fixed these mistakes or repeated them in the 'overall.feedback' and 'grammar.feedback'.

TOPIC: "${params.topic}"
CATEGORY: ${params.category}
SPEAKING DURATION: ${params.duration} seconds
ESTIMATED WPM: ${params.wpm}
PAUSE COUNT: ${params.pauseCount}
ADAPTIVE ELO RATING: ${params.eloRating}
AI COACH PERSONA: ${params.aiPersonality}

PAST CONTEXT & ERRORS TO TRACK:
${params.pastContext ? params.pastContext : "First session or no outstanding errors tracked yet."}

STRICT SCORING GUIDELINES (follow these or the scores are worthless):
- 90-100: Exceptional. Near-native fluency, zero errors, rich vocabulary, perfect structure. Almost nobody gets this on a casual recording.
- 75-89: Strong. Minor issues but clearly competent. Good vocabulary and structure.
- 60-74: Developing. Noticeable errors, basic vocabulary, incomplete structure. This is where most intermediate learners land.
- 40-59: Weak. Frequent errors, very basic vocabulary, poor structure, doesn't fully address the topic.
- 0-39: Very weak. Barely comprehensible, fails to address the topic.

ADAPTIVE DIFFICULTY RULE:
- If ELO is low (<1000), prioritize foundational corrections and simple tactical advice.
- If ELO is mid (1000-1400), use moderate complexity and push structured responses.
- If ELO is high (>1400), demand high precision and nuanced vocabulary.

SCORING FACTORS (Evaluate strictly according to IELTS Speaking band descriptors weighting these 4 areas equally):
- TASK FULFILLMENT & TOPIC DEVELOPMENT: Did the speaker fully address the prompt? If the prompt requires a detailed description (like IELTS Part 2) and they only give a one-sentence answer, score them VERY LOW (Band 3-4 max) because they failed to develop the topic. Short answers are only acceptable if they fully and naturally answer a simple, direct question.
- FLUENCY & COHERENCE: Did they speak at length without noticeable hesitation? Did they use logical frameworks, sequencing, and connectors to link their ideas?
- LEXICAL RESOURCE (VOCABULARY): Did they use a wide range of vocabulary with precision? If they only used basic A1/A2 words to describe an advanced topic, penalize their score heavily.
- GRAMMATICAL RANGE & ACCURACY: Did they use a mix of simple and complex sentence structures? Did they make frequent errors that impeded understanding?

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
      "lexicalDiversity": <float 0-1>,
      "cefrLevel": "<A1-C2>",
      "basicWordsFlagged": [
        {
          "original": "<basic word the speaker used>",
          "context": "<the sentence where it was used>",
          "suggestions": [
            {
              "word": "<C1/C2 level word that native Americans actually use>",
              "register": "<casual|professional|academic>",
              "definition": "<clear definition>",
              "pronunciation": "<American IPA pronunciation, e.g. /ɪˈlæb.ə.reɪt/>"
            }
          ]
        }
      ],
      "phraseUpgrades": [
        {
          "original": "<an awkward or non-native phrase the user said>",
          "suggestion": "<the natural, idiomatic way a native speaker would say it, or instruction on where to pause for impact>",
          "explanation": "<brief explanation why the suggestion is better>"
        }
      ],
      "advancedWordsUsed": ["<string>"],
      "feedback": "<2-3 sentences>"
    },
    "grammar": {
      "score": <0-100>,
      "errors": [
        {
          "originalText": "<exact text from transcript>",
          "correctedText": "<corrected version>",
          "errorType": "<article|tense|agreement|preposition|word_order|other>",
          "explanation": "<string>"
        }
      ],
      "feedback": "<2-3 sentences>"
    },
    "structure": {
      "score": <0-100>,
      "frameworkDetected": "<PREP|STAR|PEE|OREO|Problem-Solution|Chronological|none>",
      "frameworkAdherence": {
        "segments": [{"label": "<string>", "present": <bool>}],
        "missingElements": ["<string>"]
      },
      "bestFrameworks": [
        {"name": "<framework name>", "fit": "<why this framework fits this topic, 1 sentence>"}
      ],
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
      "summary": "<3-4 sentence summary. Be honest about weaknesses.>",
      "topStrength": "<string>",
      "topWeakness": "<string>",
      "actionableTip": "<ONE specific, actionable thing to practice next>",
      "nativeVersion": "<How a native American English speaker would answer the same topic naturally. Write a full 150-200 word response in a natural, conversational-but-polished style with C1 vocabulary and idiomatic expressions.>",
      "upgradedTranscript": "<Take the speaker's EXACT story/content and rewrite it in fluent, natural C1-level English. Keep their ideas and narrative but upgrade the vocabulary, grammar, and flow to sound like a native speaker. Same story, better English.>",
      "newMistakesToTrack": [
        {
           "rule": "<The underlying principle violated, e.g. 'Subject-Verb Agreement (3rd Person Singular)' or 'Missing Definite Article'>",
           "errorType": "<grammar|vocabulary|phrase|action_step>",
           "exampleOriginal": "<exact text to fix>",
           "exampleSuggestion": "<better way>"
        }
      ],
      "mistakesAvoided": ["<string: id of the mistake from ACTIVE MISTAKES LEDGER that the user successfully avoided or didn't make>"],
      "mistakesRepeated": ["<string: id of the mistake from ACTIVE MISTAKES LEDGER that the user repeated>"]
    }
  }
}

CRITICAL RULES:
1. TRANSCRIBE accurately — include exactly what was said with proper punctuation.
2. SCORE STRICTLY using the guidelines above. Do NOT inflate scores. A short, basic answer should score 40-55 overall.
3. For vocabulary suggestions, you MUST flag AT LEAST 5 basic words and provide C1/C2 alternatives that native American English speakers actually use. Explain the nuances of American slang or idioms when applicable. Include American IPA pronunciation. If the audio is very short, find at least 2.
4. For "phraseUpgrades", provide UNLIMITED upgrades. Act like a REAL teacher addressing a layman: teach them how to use descriptive adjectives/adverbs, how to structure their thoughts, or how to connect sentences naturally (e.g., instead of two short sentences, use a connector like 'Hoping to light up the garden, he visited the local market...'). Explain WHY the upgrade works.
5. Suggest 3-4 DIFFERENT frameworks that would work well for this topic (e.g., PREP, STAR, PEE, OREO, Problem-Solution). Don't just default to PREP.
6. The "nativeVersion" should sound like a real American adult speaking naturally — use contractions, idioms, and natural rhythm. Not robotic or overly formal.
7. The "upgradedTranscript" must preserve the speaker's original ideas and story but upgrade the language to C1 level. Same content, better delivery.
8. Detect filler words from the AUDIO (um, uh, like, you know, basically, etc.). Listen for pauses, hesitations, mumbling, and self-corrections.
9. PROGRESS TRACKING: Read the "ACTIVE MISTAKES LEDGER". If they repeated a past mistake, politely point it out in their evaluation and return its ID in "mistakesRepeated". If they had the opportunity to make the mistake but successfully avoided it (or generally demonstrated mastery of that rule), return its ID in "mistakesAvoided".
10. RECORD NEW MISTAKES: Explicitly list any new major recurring mistakes in "newMistakesToTrack". CRITICAL: DO NOT track silly, isolated pedantic swaps like 'game' -> 'games' or 'ideal weekend' -> 'an ideal weekend'. Track the UNDERLYING RULE as a teacher would. For example, originalText should be "Subject-Verb Agreement (s/es on 3rd person)" or "Missing Articles (a/an/the)". Make the tracking about learning a rule, not fixing a single string. Also ALWAYS include the "actionableTip" as an 'action_step' type so we track if they apply it next time.
11. Return ONLY valid JSON, no markdown.`;
}

// ---- Mock Analysis (when no API key) ----
function getMockAnalysis(duration: number, wpm: number) {
  return {
    clarity: {
      score: 55,
      fillerWords: [{ word: "um", count: 3 }, { word: "like", count: 2 }],
      totalFillers: 5,
      feedback:
        "You used several filler words which break the flow of your speech. Practice pausing silently instead of saying 'um' — confident speakers embrace silence.",
    },
    vocabulary: {
      score: 45,
      lexicalDiversity: 0.45,
      cefrLevel: "B1",
      basicWordsFlagged: [],
      advancedWordsUsed: [],
      feedback:
        "Your vocabulary is mostly basic (A2-B1 range). To improve, replace common words like 'good', 'nice', 'thing' with C1 alternatives. Visit your word bank after each session.",
    },
    grammar: {
      score: 55,
      errors: [],
      feedback:
        "Connect your Gemini API key for detailed grammar analysis. We'll identify article errors, tense inconsistencies, and subject-verb agreement issues.",
    },
    structure: {
      score: 35,
      frameworkDetected: "none",
      frameworkAdherence: {
        segments: [],
        missingElements: ["Clear Point", "Supporting Reason", "Specific Example", "Conclusion"],
      },
      bestFrameworks: [
        { name: "PREP", fit: "Great for opinion questions — Point, Reason, Example, Point." },
        { name: "STAR", fit: "Perfect for experience-based topics — Situation, Task, Action, Result." },
        { name: "PEE", fit: "Ideal for argument topics — Point, Evidence, Explanation." },
      ],
      coherenceScore: 40,
      transitionWordsUsed: [],
      feedback:
        "Your response lacked clear structure. Try organizing your thoughts using a framework before speaking.",
      suggestedFramework: "PREP",
    },
    fluency: {
      score: Math.min(100, Math.round((wpm || 100) / 1.5)),
      wordsPerMinute: wpm || 100,
      selfCorrectionCount: 2,
      ieltsBandEstimate: 5.5,
      feedback: `You spoke at approximately ${wpm || 100} words per minute. Native speakers average 120-150 WPM. Focus on maintaining a steady rhythm without rushing.`,
    },
    confidence: {
      score: 50,
      hedgingPhrases: ["I think maybe", "kind of", "not sure but"],
      assertivePhrases: [],
      feedback:
        "Your speech contained several hedging phrases that undermine your authority. Replace 'I think maybe' with 'I believe' or 'In my view'.",
    },
    overall: {
      score: 45,
      summary: `You spoke for ${duration} seconds but the response lacked depth and structure. To improve significantly, use a speaking framework, expand your answers with specific examples, and practice using C1-level vocabulary.`,
      topStrength: "Willingness to practice and attempt the topic",
      topWeakness: "Response too short and lacking in detail — needs more depth and structure",
      actionableTip:
        "Before speaking, take 5 seconds to mentally outline: 1) Your main point, 2) One reason why, 3) One specific example. This alone will boost your score by 15-20 points.",
      nativeVersion: "(Connect Gemini API for native speaker version)",
      upgradedTranscript: "(Connect Gemini API for upgraded transcript)",
    },
  };
}

