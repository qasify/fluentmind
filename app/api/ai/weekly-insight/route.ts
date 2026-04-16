import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

export async function POST(req: Request) {
  try {
    const { sessions, mistakes, vocabularyBank, profile, eloRating } = await req.json();

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const recentSessions = sessions.slice(0, 7);
    const activeMistakes = mistakes.filter((m: any) => m.status === "active");

    const prompt = `You are FluentMind AI, a world-class ESL coach generating a concise WEEKLY PERFORMANCE INSIGHT for a language learner.

USER PROFILE:
Name: ${profile.displayName || "Learner"}
Goal: ${profile.goal || "General fluency"}
Level: ${profile.currentLevel || "Unknown"}
ELO Rating: ${eloRating}

THIS WEEK'S SESSIONS (${recentSessions.length} total):
${recentSessions.map((s: any) => `- Topic: "${s.topic}" | Overall: ${s.analysis?.overall?.score ?? 0}/100 | Grammar: ${s.analysis?.grammar?.score ?? 0} | Vocab: ${s.analysis?.vocabulary?.score ?? 0} | Fluency: ${s.analysis?.fluency?.score ?? 0}`).join("\n") || "No sessions this week."}

ACTIVE MISTAKES (${activeMistakes.length}):
${activeMistakes.slice(0, 5).map((m: any) => `- ${m.rule} (${m.examples?.length || 0} occurrences)`).join("\n") || "None"}

VOCABULARY BANK: ${vocabularyBank.length} words saved, ${vocabularyBank.filter((v: any) => v.masteryLevel === "mastered").length} mastered.

INSTRUCTIONS:
Generate a short, punchy weekly insight report. Be honest, specific, and encouraging. Output EXACTLY this JSON (no markdown):

{
  "headline": "<A bold 5-8 word headline summarizing the week, e.g. 'Grammar Improved, Vocabulary Needs Work'>",
  "summary": "<2-3 sentence honest overview of performance this week>",
  "wins": ["<specific win 1>", "<specific win 2>"],
  "focusAreas": ["<specific area to improve 1>", "<specific area 2>"],
  "motivationalQuote": "<A relevant, inspiring quote about language learning or perseverance>",
  "eloChange": "<+15 or -10 etc, estimate based on performance trends>",
  "weeklyGrade": "<A+ to F, be strict>"
}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
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

    const data = JSON.parse(candidateText);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Weekly insight generation failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
