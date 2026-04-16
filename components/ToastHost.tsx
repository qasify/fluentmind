"use client";

import { useEffect, useMemo } from "react";
import { useToastStore, type Toast } from "@/lib/toastStore";

function typeStyles(type: Toast["type"]) {
  switch (type) {
    case "success":
      return "border-success-500/20 bg-success-500/10 text-success-400";
    case "warning":
      return "border-warning-500/20 bg-warning-500/10 text-warning-400";
    case "error":
      return "border-danger-500/20 bg-danger-500/10 text-danger-400";
    default:
      return "border-primary-500/20 bg-primary-500/10 text-primary-300";
  }
}

export default function ToastHost() {
  const { toasts, removeToast } = useToastStore();

  // Auto-dismiss
  useEffect(() => {
    const now = Date.now();
    const timers = toasts.map((t) => {
      const remaining = Math.max(250, t.durationMs - (now - t.createdAt));
      return setTimeout(() => removeToast(t.id), remaining);
    });
    return () => timers.forEach(clearTimeout);
  }, [toasts, removeToast]);

  const ordered = useMemo(() => toasts.slice(0, 4), [toasts]);

  if (ordered.length === 0) return null;

  return (
    <div className="fixed top-3 right-3 z-[300] flex flex-col gap-2 w-[min(92vw,380px)]">
      {ordered.map((t) => (
        <div
          key={t.id}
          className={`rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md ${typeStyles(t.type)}`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {t.title && <div className="text-sm font-semibold text-[#f0f0f5]">{t.title}</div>}
              <div className="text-sm text-[#c8c8d5]">{t.message}</div>
            </div>
            <button
              className="text-xs font-bold opacity-70 hover:opacity-100"
              onClick={() => removeToast(t.id)}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

