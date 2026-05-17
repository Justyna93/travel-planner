"use client";

import { useEffect, useRef } from "react";

export function AddSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <div
        className="absolute inset-0 bg-black/40 animate-[fadeIn_.15s_ease]"
        onClick={onClose}
      />
      <div
        ref={ref}
        className="relative w-full sm:max-w-md bg-[color:var(--card)] rounded-t-2xl sm:rounded-2xl shadow-xl p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:pb-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-[color:var(--muted)] px-2 py-1">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
