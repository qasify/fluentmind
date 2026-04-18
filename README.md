# 🧠 FluentMind

[fluentmind-ai.vercel.app](https://fluentmind-ai.vercel.app/)

FluentMind is an advanced, AI-driven language learning platform designed to take English learners from intermediate plateaus to advanced fluency (CEFR B2 to C2+). Unlike simple language apps, FluentMind acts as a relentless, personalized AI tutor that analyzes your speech, tracks persistent errors over time, and dynamically generates a rigorous curriculum based on your unique weaknesses.

## 🚀 Key Features

*   **🎙️ Intelligent Speaking Studio**
    *   Record voice sessions on hundreds of topics.
    *   **Advanced AI Evaluation:** Transcribes audio, analyzes WPM and pauses, and provides extremely detailed, strict scoring across 6 dimensions: **Clarity, Vocabulary, Grammar, Structure, Fluency, and Confidence**.
*   **📚 Dynamic Vocabulary Bank & Flashcards**
    *   Extracts C1/C2 level words naturally suited for what you were *trying* to say.
    *   Spaced Retrieval System (FSRS) for flashcard reviews to guarantee long-term mastery.
*   **🗣️ Dynamic Voice Conversations**
    *   Have real-time, fluid conversations with an AI tutor using the browser's SpeechSynthesis and SpeechRecognition APIs, combined with Gemini's intelligence.
*   **📅 AI Curriculum Engine**
    *   Generates a personalized, 7-day curriculum based on your ELO rating, goals, and historic weak points. Combines speaking tasks, grammar drills, and written essays.
*   **🎯 Mistake Ledger & Adaptive Difficulty**
    *   Tracks persistent error patterns across sessions (e.g., "Subject-Verb Agreement").
    *   Employs an ELO Rating system that mathematically scales the difficulty and strictness of the AI prompts based on your performance.
*   **🎓 IELTS Exam Simulator**
    *   A full, timed simulation of IELTS Speaking Parts 1, 2, and 3. Includes a prep-time scratchpad and generates official IELTS Band estimates.
*   **📊 Comprehensive Dashboard & Progress Tracking**
    *   Multi-metric growth charts (Filler Word Trends, Grammar Score Evolution, Fluency Evolution).
    *   On-demand **Weekly AI Insight Reports** highlighting wins, focus areas, and a weekly performance grade.
*   **🎭 Customizable AI Persona**
    *   Switch between different coaching styles: "Encouraging Coach", "Strict IELTS Examiner", "Casual Friend", or "Socratic Tutor".

## 🛠️ Tech Stack

*   **Framework:** [Next.js 15](https://nextjs.org/) (App Router, React 19)
*   **Styling:** Custom Vanilla CSS Design System with targeted Tailwind utility classes.
*   **State Management:** [Zustand](https://github.com/pmndrs/zustand)
*   **Backend / Auth:** [Supabase](https://supabase.com/) (PostgreSQL, Edge Functions, Storage)
*   **AI Engine:** Google Gemini (1.5 / 2.0 Flash) Multimodal API
*   **Icons / Animations:** Framer Motion

## ⚙️ Local Development

### Prerequisites

You will need Node.js (v18+), an active Supabase project, and a Google Gemini API Key.

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/fluentmind.git
cd fluentmind
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODAL=your_gemini_modal_name
```

### 3. Database Migration

Push the required SQL migrations to your Supabase instance to create the necessary tables for profiles, sessions, mistakes, vocabulary, and exams.

```bash
npx supabase db push
```

### 4. Run the Dev Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## 🗄️ Database Architecture

FluentMind utilizes a relational structure via Supabase:
*   `profiles`: User configuration, ELO rating, active AI persona, cumulative XP.
*   `sessions`: Historical logs of all practice recordings, raw audio URLs, and full AI JSON evaluation data.
*   `mistakes`: The active "Ledger" tracking persistent grammatical errors and avoidance counts for graduation.
*   `vocabulary_bank`: Saved advanced vocabulary with Spaced Repetition (FSRS) metadata (intervals, ease factors, next review dates).
*   `curriculums`: Snapshot of the active 7-day personalized progression plan.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check [issues page](https://github.com/yourusername/fluentmind/issues).

## 📝 License

This project is licensed under the MIT License.
