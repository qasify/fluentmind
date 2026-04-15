"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

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
      {label && <div className="sidebar-section-label">{label}</div>}
      <nav className="sidebar-nav">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
              onClick={onClose}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
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
          className={`${styles.overlay} mobile-overlay`}
          onClick={onClose}
        />
      )}

      <aside
        className={`sidebar ${isOpen ? "sidebar-open" : ""}`}
        id="main-sidebar"
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">F</div>
          <span className="sidebar-logo-text">
            Fluent<span className="gradient-text">Mind</span>
          </span>
        </div>

        {/* Streak & XP Card */}
        <div className={styles.statusCard}>
          <div className={styles.statusRow}>
            <span className={`${styles.streakIcon} streak-fire`}>🔥</span>
            <span className={styles.streakCount}>{streakCount}</span>
            <span className={styles.streakLabel}>day streak</span>
          </div>
          <div className={styles.xpBar}>
            <div className={styles.xpBarInner}>
              <div
                className={styles.xpBarFill}
                style={{ width: `${(xp % 500) / 5}%` }}
              />
            </div>
            <span className={styles.xpLabel}>
              Lvl {level} · {xp} XP
            </span>
          </div>
          <span className={styles.levelTitle}>{levelTitle}</span>
        </div>

        {/* Navigation */}
        {renderNavSection(mainNav, "Practice")}
        {renderNavSection(learnNav, "Learn")}
        {renderNavSection(trackNav, "Track")}

        {/* Bottom */}
        <div className="sidebar-footer">
          {renderNavSection(bottomNav)}
        </div>
      </aside>
    </>
  );
}
