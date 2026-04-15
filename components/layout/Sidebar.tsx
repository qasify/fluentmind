"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "🏠" },
  { label: "Record", href: "/practice/record", icon: "🎙️" },
  { label: "Conversation", href: "/practice/conversation", icon: "🗣️" },
  { label: "Debate", href: "/practice/debate", icon: "⚔️" },
];

const learnNav: NavItem[] = [
  { label: "Vocabulary", href: "/vocabulary", icon: "📚" },
  { label: "Curriculum", href: "/curriculum", icon: "📋" },
  { label: "Homework", href: "/homework", icon: "📝" },
  { label: "Exam Center", href: "/exam", icon: "🎓" },
];

const trackNav: NavItem[] = [
  { label: "Progress", href: "/progress", icon: "📈" },
  { label: "History", href: "/history", icon: "📂" },
];

const bottomNav: NavItem[] = [
  { label: "Settings", href: "/settings", icon: "⚙️" },
  { label: "Profile", href: "/profile", icon: "👤" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  streakCount?: number;
  xp?: number;
  level?: number;
  levelTitle?: string;
}

export default function Sidebar({
  isOpen,
  onClose,
  streakCount = 0,
  xp = 0,
  level = 1,
  levelTitle = "Novice Communicator",
}: SidebarProps) {
  const pathname = usePathname();

  const renderNavSection = (items: NavItem[], label?: string) => (
    <>
      {label && <div className="text-xs font-semibold uppercase tracking-widest text-[#6b6b80] px-2 py-4">{label}</div>}
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-all duration-150 whitespace-nowrap ${
                isActive ? "text-primary-400 bg-primary-500/10" : "text-[#a0a0b5] hover:text-[#f0f0f5] hover:bg-[rgba(255,255,255,0.03)]"
              }`}
              onClick={onClose}
            >
              <span className="w-5 h-5 flex items-center justify-center shrink-0 text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[199] md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-[260px] bg-background-secondary border-r border-[rgba(255,255,255,0.06)] flex flex-col p-4 transition-transform duration-250 overflow-y-auto overflow-x-hidden z-[100] ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        id="main-sidebar"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 py-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center text-lg font-extrabold text-white shrink-0">F</div>
          <span className="text-lg font-bold whitespace-nowrap">
            Fluent<span className="gradient-text">Mind</span>
          </span>
        </div>

        {/* Streak & XP Card */}
        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg p-3 px-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg streak-fire">🔥</span>
            <span className="text-xl font-extrabold text-warning-400">{streakCount}</span>
            <span className="text-sm text-[#6b6b80]">day streak</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-background-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(xp % 500) / 5}%` }}
              />
            </div>
            <span className="text-xs text-[#6b6b80] whitespace-nowrap font-medium">
              Lvl {level} · {xp} XP
            </span>
          </div>
          <span className="text-xs text-primary-400 font-semibold block mt-1">{levelTitle}</span>
        </div>

        {/* Navigation */}
        {renderNavSection(mainNav, "Practice")}
        {renderNavSection(learnNav, "Learn")}
        {renderNavSection(trackNav, "Track")}

        {/* Bottom */}
        <div className="mt-auto pt-4 border-t border-[rgba(255,255,255,0.06)]">
          {renderNavSection(bottomNav)}
        </div>
      </aside>
    </>
  );
}
