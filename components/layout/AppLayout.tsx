"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        streakCount={0}
        xp={0}
        level={1}
        levelTitle="Novice Communicator"
      />

      {/* Mobile header */}
      <div className="mobile-header">
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          id="mobile-menu-btn"
        >
          ☰
        </button>
        <span style={{ fontWeight: 700 }}>
          Fluent<span className="gradient-text">Mind</span>
        </span>
        <div style={{ width: 36 }} />
      </div>

      <main className="main-content">{children}</main>
    </div>
  );
}
