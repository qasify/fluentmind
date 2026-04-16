"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { useAppStore } from "@/lib/store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentStreak, totalXp, currentLevel, currentLevelTitle, initializeStore, isHydrated, profile } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) {
      initializeStore();
    } else if (isHydrated && !profile.onboardingComplete) {
      router.push("/onboarding");
    }
  }, [isHydrated, initializeStore, profile.onboardingComplete, router]);

  if (!isHydrated || !profile.onboardingComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#a0a0b5]">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        streakCount={currentStreak}
        xp={totalXp}
        level={currentLevel}
        levelTitle={currentLevelTitle}
      />

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-3 px-4 bg-background-secondary border-b border-[rgba(255,255,255,0.06)] sticky top-0 z-[150] w-full">
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          id="mobile-menu-btn"
        >
          ☰
        </button>
        <span className="font-bold">
          Fluent<span className="gradient-text">Mind</span>
        </span>
        <div className="w-[36px]" />
      </div>

      <main className="md:ml-[260px] min-h-screen transition-all duration-250 flex flex-col">
        {children}
      </main>
    </div>
  );
}
