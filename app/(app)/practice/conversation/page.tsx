"use client";

import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SCENARIO_CATEGORIES = [
  {
    id: "roleplay",
    name: "Roleplay",
    icon: "🎭",
    scenarios: [
      { id: "coffee_shop", title: "Ordering at a busy Coffee Shop", desc: "Practice handling barista questions and ordering complex drinks." },
      { id: "airport_customs", title: "Airport Customs", desc: "Answer standard immigration questions confidently." },
      { id: "doctor_appt", title: "Doctor's Appointment", desc: "Explain your symptoms and understand medical advice." }
    ]
  },
  {
    id: "professional",
    name: "Professional",
    icon: "💼",
    scenarios: [
      { id: "job_interview", title: "Job Interview", desc: "Answer behavioral interview questions (STAR method)." },
      { id: "salary_neg", title: "Salary Negotiation", desc: "Advocate for a higher starting salary politely." },
      { id: "project_update", title: "Project Update Meeting", desc: "Give a status update to your manager." }
    ]
  },
  {
    id: "debate",
    name: "Debate",
    icon: "⚖️",
    scenarios: [
      { id: "remote_work", title: "Remote Work vs Office", desc: "Argue for or against remote work. Assistant will disagree." },
      { id: "ai_ethics", title: "AI Ethics", desc: "Debate the implications of AI on humanity." }
    ]
  },
  {
    id: "casual",
    name: "Casual",
    icon: "☕",
    scenarios: [
      { id: "new_friend", title: "Meeting a New Friend", desc: "Make small talk at a networking event." },
      { id: "travel_plans", title: "Discussing Travel Plans", desc: "Chat about where you want to go on your next vacation." }
    ]
  }
];

export default function ConversationScenariosPage() {
  const router = useRouter();
  const { createConversation } = useAppStore();
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = async (scenarioId: string, scenarioTitle: string) => {
    setIsStarting(true);
    const convId = await createConversation(scenarioId, scenarioTitle);
    if (convId) {
      router.push(`/practice/conversation/${convId}`);
    } else {
      setIsStarting(false);
      alert("Failed to start conversation. Are you logged in?");
    }
  };

  return (
    <div className="page-container flex flex-col min-h-screen py-8 fade-in">
      <div className="mb-8">
        <h1 className="heading-2 mb-2">AI Conversation Partner</h1>
        <p className="text-lg text-[#a0a0b5]">
          Select a scenario to start a voice chat. The AI will respond in character and secretly check your grammar!
        </p>
      </div>

      <div className="flex flex-col gap-10 pb-20">
        {SCENARIO_CATEGORIES.map((category) => (
          <div key={category.id}>
            <h2 className="heading-4 flex items-center gap-2 mb-4">
              <span>{category.icon}</span> {category.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  disabled={isStarting}
                  onClick={() => handleStart(scenario.id, scenario.title)}
                  className="card p-5 text-left flex flex-col hover:border-primary-500/50 hover:bg-primary-500/5 transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-[#f0f0f5] group-hover:text-primary-400 transition-colors">{scenario.title}</h3>
                    <span className="text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity">➜</span>
                  </div>
                  <p className="text-sm text-[#a0a0b5]">{scenario.desc}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
