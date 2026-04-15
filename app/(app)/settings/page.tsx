"use client";

import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const { profile, setProfile } = useAppStore();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">⚙️ Settings</h1>
        <p className="page-subtitle">Customize your FluentMind experience</p>
      </div>

      <div className="card p-6 mb-4 flex items-center justify-between">
        <div>
          <h3 className="heading-5 mb-1">Account Management</h3>
          <p className="text-sm text-[#a0a0b5]">Manage your login session</p>
        </div>
        <button
          className="btn border-danger-500/30 text-danger-400 hover:bg-danger-500/10 hover:border-danger-500 border border-transparent px-4 py-2 rounded-xl transition-colors font-medium flex items-center gap-2"
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = "/login";
          }}
        >
          🚪 Logout / Switch User
        </button>
      </div>

      <div className="card p-6 mb-4">
        <h3 className="heading-5 mb-6">Profile</h3>
        <div className="input-wrapper mb-4">
          <label className="input-label">Display Name</label>
          <input
            type="text"
            className="input"
            value={profile.displayName}
            onChange={(e) => setProfile({ displayName: e.target.value })}
            placeholder="Your name"
          />
        </div>
        <div className="input-wrapper mb-4">
          <label className="input-label">Native Language</label>
          <input
            type="text"
            className="input"
            value={profile.nativeLanguage}
            onChange={(e) => setProfile({ nativeLanguage: e.target.value })}
            placeholder="e.g. Urdu"
          />
        </div>
      </div>

      <div className="card p-6 mb-4">
        <h3 className="heading-5 mb-6">Practice Preferences</h3>
        <div className="input-wrapper mb-4">
          <label className="input-label">Daily Goal (minutes)</label>
          <div className="grid grid-cols-4 gap-3">
            {[3, 5, 10, 15].map((min) => (
              <button
                key={min}
                onClick={() => setProfile({ dailyGoalMinutes: min })}
                className={`py-3 rounded-xl border text-center font-bold transition-all ${
                  profile.dailyGoalMinutes === min
                    ? "bg-primary-500/10 border-primary-500/30 text-primary-400"
                    : "bg-background-tertiary border-[rgba(255,255,255,0.06)] text-[#a0a0b5] hover:border-[rgba(255,255,255,0.12)]"
                }`}
              >
                {min} min
              </button>
            ))}
          </div>
        </div>
        <div className="input-wrapper mb-4">
          <label className="input-label">Your Goal</label>
          <select
            className="input"
            value={profile.goal}
            onChange={(e) => setProfile({ goal: e.target.value as typeof profile.goal })}
          >
            <option value="">Select a goal</option>
            <option value="ielts">IELTS / Exam Preparation</option>
            <option value="professional">Professional Growth</option>
            <option value="casual">Casual Conversation</option>
            <option value="academic">Academic English</option>
          </select>
        </div>
        <div className="input-wrapper">
          <label className="input-label">Current Level</label>
          <select
            className="input"
            value={profile.currentLevel}
            onChange={(e) => setProfile({ currentLevel: e.target.value as typeof profile.currentLevel })}
          >
            <option value="">Select level</option>
            <option value="beginner">Beginner (A1-A2)</option>
            <option value="intermediate">Intermediate (B1-B2)</option>
            <option value="advanced">Advanced (C1-C2)</option>
          </select>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="heading-5 mb-6">Data</h3>
        <p className="text-sm text-[#a0a0b5] mb-4">
          All your data is stored locally in your browser. Clearing browser data will erase your progress.
        </p>
        <button
          className="btn btn-danger"
          onClick={() => {
            if (confirm("Are you sure? This will erase ALL your progress, sessions, and vocabulary.")) {
              localStorage.removeItem("fluentmind-store");
              window.location.reload();
            }
          }}
        >
          🗑️ Reset All Data
        </button>
      </div>
    </div>
  );
}
