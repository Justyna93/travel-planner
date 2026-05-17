"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { TripCard } from "@/components/TripCard";
import { HomeActions } from "./_home/HomeActions";

export default function HomePage() {
  const trips = useLiveQuery(
    () => db.trips.orderBy("created_at").reverse().toArray(),
    [],
    null,
  );

  return (
    <main className="flex-1 px-4 safe-pt pb-32">
      <header className="flex items-center justify-between py-3">
        <h1 className="text-2xl font-bold">My trips</h1>
        <div className="flex items-center gap-2">
          <Link href="/templates" className="text-sm text-[color:var(--muted)] px-2 py-2">
            Templates
          </Link>
          <Link href="/data" className="text-sm text-[color:var(--muted)] px-2 py-2">
            Data
          </Link>
        </div>
      </header>

      {trips === null ? (
        <div className="card p-6 mt-6 text-center text-sm text-[color:var(--muted)]">
          Loading…
        </div>
      ) : trips.length > 0 ? (
        <div className="grid gap-4 mt-2">
          {trips.map((t) => (
            <TripCard key={t.id} trip={t} />
          ))}
        </div>
      ) : (
        <div className="card p-6 mt-6 text-center">
          <div className="text-lg font-medium mb-1">No trips yet</div>
          <p className="text-sm text-[color:var(--muted)]">
            Tap the + button to add your first destination.
          </p>
        </div>
      )}

      <HomeActions />
    </main>
  );
}
