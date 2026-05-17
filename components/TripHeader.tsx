"use client";

import Link from "next/link";
import { useState } from "react";
import type { Trip } from "@/lib/types";

export function TripHeader({
  trip,
  backHref,
}: {
  trip: Trip;
  backHref: string;
}) {
  const [menu, setMenu] = useState(false);

  return (
    <header className="sticky top-0 z-20 bg-[color:var(--background)]/90 backdrop-blur border-b border-[color:var(--card-border)] safe-pt">
      <div className="flex items-center gap-2 px-3 py-2">
        <Link href={backHref} className="px-2 py-2 text-lg" aria-label="Back">
          ←
        </Link>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{trip.name}</div>
          {trip.destination && (
            <div className="text-xs text-[color:var(--muted)] truncate">{trip.destination}</div>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setMenu((v) => !v)}
            aria-label="Menu"
            className="px-3 py-2 text-xl leading-none"
          >
            ⋯
          </button>
          {menu && (
            <div
              className="absolute right-0 top-full mt-1 card py-1 min-w-[160px] z-30 shadow-lg"
              onClick={() => setMenu(false)}
            >
              <Link href={`/trip/${trip.id}/settings`} className="block px-3 py-2 text-sm">
                Settings
              </Link>
              <Link href="/data" className="block px-3 py-2 text-sm">
                Export / Import
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
