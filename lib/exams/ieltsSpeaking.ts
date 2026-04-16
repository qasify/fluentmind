export type ExamType = "ielts_speaking";

export type ExamMode = "full" | "part";

export type IELTSPart = 1 | 2 | 3;

export interface ExamStepPlan {
  id: string;
  examType: ExamType;
  part: IELTSPart;
  stepIndex: number;
  kind: "prep" | "question" | "long_turn";
  title: string;
  prompt: string;
  prepSeconds?: number;
  speakSeconds?: number;
}

export interface ExamRunPlan {
  id: string;
  examType: ExamType;
  mode: ExamMode;
  seed: number;
  createdAt: string;
  steps: ExamStepPlan[];
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickMany<T>(list: T[], count: number, rand: () => number): T[] {
  const copy = [...list];
  const picked: T[] = [];
  while (copy.length > 0 && picked.length < count) {
    const idx = Math.floor(rand() * copy.length);
    picked.push(copy.splice(idx, 1)[0]);
  }
  return picked;
}

function pickOne<T>(list: T[], rand: () => number): T {
  const idx = Math.floor(rand() * list.length);
  return list[idx];
}

const PART1_QUESTIONS: string[] = [
  "Can you tell me your full name, please?",
  "Where do you come from?",
  "Do you work or are you a student?",
  "What do you enjoy doing in your free time?",
  "How often do you use the internet? What do you use it for?",
  "Tell me about a type of music you enjoy listening to.",
  "Do you prefer mornings or evenings? Why?",
  "What kind of weather do you like? Why?",
  "Do you like cooking? Why or why not?",
  "Do you often read news? Where do you get it from?",
  "Do you enjoy travelling? What kind of places do you like to visit?",
  "Do you like learning languages? What helps you improve the most?",
];

type CueCard = { topic: string; points: string[]; followUps?: string[] };

const PART2_CUE_CARDS: CueCard[] = [
  {
    topic: "Describe a time when you had to make a difficult decision.",
    points: ["What the decision was", "When you had to make it", "What the options were", "Why it was difficult"],
    followUps: ["Decisions in modern life", "Advice from family vs independence"],
  },
  {
    topic: "Describe a skill you would like to learn.",
    points: ["What it is", "Why you want to learn it", "How you would learn it", "How it would help you"],
    followUps: ["Learning styles", "Technology in education"],
  },
  {
    topic: "Describe a place you visited that left a strong impression on you.",
    points: ["Where it is", "When you went", "What you did there", "Why it impressed you"],
    followUps: ["Tourism impact", "Preserving culture"],
  },
];

const PART3_QUESTIONS: string[] = [
  "Why do people sometimes find it hard to make decisions?",
  "Do you think it is better to make decisions quickly or take your time?",
  "How do cultural values influence the way people make decisions?",
  "In your opinion, should important decisions be made individually or with family input?",
  "What makes a skill useful in today’s job market?",
  "Do you think schools should focus more on practical skills or academic knowledge?",
  "How has tourism changed in the last 20 years?",
  "What are the advantages and disadvantages of living in big cities?",
  "Do you think technology has improved communication or harmed it?",
  "Why do some people find it difficult to express their opinions?",
];

export function createIeltsSpeakingRunPlan(params: {
  mode: ExamMode;
  part?: IELTSPart;
  seed?: number;
}): ExamRunPlan {
  const seed = typeof params.seed === "number" ? params.seed : Date.now();
  const rand = mulberry32(seed);

  const runId = `exam_${seed}_${Math.random().toString(36).slice(2, 7)}`;

  const partsToInclude: IELTSPart[] =
    params.mode === "part" && params.part ? [params.part] : [1, 2, 3];

  const steps: ExamStepPlan[] = [];

  const cueCard = pickOne(PART2_CUE_CARDS, rand);
  const part1Qs = pickMany(PART1_QUESTIONS, 6, rand);
  const part3Qs = pickMany(PART3_QUESTIONS, 5, rand);

  for (const part of partsToInclude) {
    if (part === 1) {
      part1Qs.forEach((q, i) => {
        steps.push({
          id: `${runId}_p1_q${i + 1}`,
          examType: "ielts_speaking",
          part: 1,
          stepIndex: steps.length,
          kind: "question",
          title: `Part 1 — Question ${i + 1}/6`,
          prompt: q,
          speakSeconds: 45,
        });
      });
    }

    if (part === 2) {
      steps.push({
        id: `${runId}_p2_prep`,
        examType: "ielts_speaking",
        part: 2,
        stepIndex: steps.length,
        kind: "prep",
        title: "Part 2 — Preparation",
        prompt: `Cue Card: ${cueCard.topic}\n\nYou should say:\n- ${cueCard.points.join("\n- ")}\n\nTake notes for one minute.`,
        prepSeconds: 60,
      });

      steps.push({
        id: `${runId}_p2_long`,
        examType: "ielts_speaking",
        part: 2,
        stepIndex: steps.length,
        kind: "long_turn",
        title: "Part 2 — Long Turn (1–2 minutes)",
        prompt: `Cue Card: ${cueCard.topic}\n\nCover these points:\n- ${cueCard.points.join("\n- ")}`,
        speakSeconds: 120,
      });
    }

    if (part === 3) {
      part3Qs.forEach((q, i) => {
        steps.push({
          id: `${runId}_p3_q${i + 1}`,
          examType: "ielts_speaking",
          part: 3,
          stepIndex: steps.length,
          kind: "question",
          title: `Part 3 — Discussion ${i + 1}/5`,
          prompt: q,
          speakSeconds: 60,
        });
      });
    }
  }

  return {
    id: runId,
    examType: "ielts_speaking",
    mode: params.mode,
    seed,
    createdAt: new Date().toISOString(),
    steps,
  };
}

