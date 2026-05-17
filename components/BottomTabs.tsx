"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { key: "places", label: "Places", icon: "📍" },
  { key: "info", label: "Info", icon: "ℹ️" },
  { key: "plan", label: "Plan", icon: "🗓" },
  { key: "buy", label: "Buy", icon: "🛒" },
  { key: "pack", label: "Pack", icon: "🎒" },
];

export function BottomTabs({ base }: { base: string }) {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-[color:var(--card)] border-t border-[color:var(--card-border)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {TABS.map((t) => {
          const href = `${base}/${t.key}`;
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={t.key}>
              <Link
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs ${
                  active ? "text-[color:var(--accent)] font-semibold" : "text-[color:var(--muted)]"
                }`}
              >
                <span className="text-xl leading-none">{t.icon}</span>
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
