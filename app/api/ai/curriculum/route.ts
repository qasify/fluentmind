import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODAL = process.env.GEMINI_MODAL;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODAL}:generateContent`;

export async function POST(req: Request) {
  try {
    const { profile, activeMistakes, recentSessions, eloRating } = await req.json();
    const safeMistakes = Array.isArray(activeMistakes) ? activeMistakes : [];
    const safeSessions = Array.isArray(recentSessions) ? recentSessions : [];

    const prompt = `You are an expert ESL / English language coach.
You are tasked with generating a personalized, highly structured 7-day curriculum for an English learner.

USER PROFILE:
Goal: ${profile.goal || "Improve English fluency"}
Level: ${profile.currentLevel || "Unknown"}
Daily Commitment: ${profile.dailyGoalMinutes} minutes
Current ELO Difficulty Rating: ${typeof eloRating === "number" ? eloRating : 1200}
AI Coach Persona: ${profile.aiPersonality || "encouraging_coach"}

ACTIVE MISTAKES (The user is actively working to fix these rules):
${safeMistakes.map((m: any) => `- Rule: ${m.rule} (Example: "${m.examples?.[0]?.originalText}" -> "${m.examples?.[0]?.suggestion}")`).join("\n") || "- None recorded yet."}

RECENT SESSIONS SUMMARY:
${safeSessions.map((s: any) => `- Topic: ${s.topic} | Score: ${s.analysis?.overall?.score || 0}/100 | Top Weakness: ${s.analysis?.overall?.topWeakness || "None"}`).join("\n") || "- No recent sessions."}

INSTRUCTIONS:
1. Analyze the user's profile, mistakes, and recent sessions.
2. Apply adaptive difficulty from ELO:
   - ELO < 1000: beginner-safe tasks
   - ELO 1000-1300: intermediate structured drills
   - ELO 1300-1600: challenging professional/academic scenarios
   - ELO > 1600: advanced nuanced argumentation and precision tasks
3. Match tone to AI coach persona while keeping tasks actionable.
4. Formulate 2-3 specific grammatical, vocabulary, or speaking "Focus Areas" for this week.
5. Generate exactly 7 rigorous, challenging tasks (one for each day). DO NOT generate trivial instructions. Describe the task with rich context, giving them a specific complex scenario to address (e.g. "Write an emergency email to an angry client using passive voice" or "Debate the ethical implications of AI privacy for 2 solid minutes").
6. Tasks can be of type: "speaking" (solo recording), "conversation" (roleplay), "vocabulary" (FSRS review), "grammar" (written drill), or "writing" (essay/email). DO NOT use "homework", use "writing" instead.
7. Output EXACTLY the following JSON schema (no markdown, no backticks, just raw JSON).

{
  "focusAreas": ["string", "string"],
  "tasks": [
    {
      "dayNumber": 1,
      "title": "<Short action-oriented title, e.g. 'Master Present Perfect'>",
      "type": "<speaking | conversation | vocabulary | grammar | writing>",
      "description": "<Detailed, 2-3 sentence description of an advanced scenario to resolve or drill>",
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
