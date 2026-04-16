import { create } from "zustand";

export type ToastType = "success" | "info" | "warning" | "error";

export type Toast = {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  createdAt: number;
  durationMs: number;
};

type ToastState = {
  toasts: Toast[];
  pushToast: (toast: Omit<Toast, "id" | "createdAt"> & { id?: string; createdAt?: number }) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
};

function makeId() {
  return `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  pushToast: (toast) => {
    const id = toast.id || makeId();
    const createdAt = toast.createdAt || Date.now();
    const durationMs = toast.durationMs ?? 4000;

    set((s) => ({
      toasts: [
        { id, createdAt, durationMs, type: toast.type, title: toast.title, message: toast.message },
        ...s.toasts,
      ].slice(0, 4),
    }));

    return id;
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clearToasts: () => set({ toasts: [] }),
}));

