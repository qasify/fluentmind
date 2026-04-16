import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

export async function POST(req: Request) {
  try {
    const { profile, activeMistakes, recentSessions } = await req.json();

    const prompt = `You are an expert ESL / English language coach.
You are tasked with generating a personalized, highly structured 7-day curriculum for an English learner.

USER PROFILE:
Goal: ${profile.goal || "Improve English fluency"}
Level: ${profile.currentLevel || "Unknown"}
Daily Commitment: ${profile.dailyGoalMinutes} minutes

ACTIVE MISTAKES (The user is actively working to fix these rules):
${activeMistakes.map((m: any) => `- Rule: ${m.rule} (Example: "${m.examples?.[0]?.originalText}" -> "${m.examples?.[0]?.suggestion}")`).join("\n") || "- None recorded yet."}

RECENT SESSIONS SUMMARY:
${recentSessions.map((s: any) => `- Topic: ${s.topic} | Score: ${s.analysis?.overall?.score || 0}/100 | Top Weakness: ${s.analysis?.overall?.topWeakness || "None"}`).join("\n") || "- No recent sessions."}

INSTRUCTIONS:
1. Analyze the user's profile, mistakes, and recent sessions.
2. Formulate 2-3 specific grammatical, vocabulary, or speaking "Focus Areas" for this week.
3. Generate exactly 7 tasks (one for each day of the week).
4. Tasks can be of type: "speaking" (solo recording), "conversation" (roleplay), "vocabulary" (FSRS review), "grammar" (focused drill), or "homework" (reading/listening comprehension).
5. Output EXACTLY the following JSON schema (no markdown, no backticks, just raw JSON).

{
  "focusAreas": ["string", "string"],
  "tasks": [
    {
      "dayNumber": 1,
      "title": "<Short action-oriented title, e.g. 'Master Present Perfect'>",
      "type": "<speaking | conversation | vocabulary | grammar | homework>",
      "description": "<1-2 sentence description of what the user needs to do>",
      "targetFocus": "<The specific rule or topic they should focus on>"
    }
  ]
}
`;

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

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

    const generatedTasks = data.tasks.map((t: any, idx: number) => ({
      ...t,
      id: `task_${Date.now()}_${idx}`,
      isCompleted: false
    }));

    return NextResponse.json({ success: true, data: { focusAreas: data.focusAreas, tasks: generatedTasks } });
  } catch (error: any) {
    console.error("Curriculum generation failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
