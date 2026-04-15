"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        streakCount={0}
        xp={0}
        level={1}
        levelTitle="Novice Communicator"
      />

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-3 px-4 bg-background-secondary border-b border-[rgba(255,255,255,0.06)] sticky top-0 z-[100] w-full">
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

      <main className="flex-1 md:ml-[260px] min-h-screen transition-all duration-250 w-full">
        {children}
      </main>
    </div>
  );
}
