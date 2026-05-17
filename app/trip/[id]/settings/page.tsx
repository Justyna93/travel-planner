"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { TripSettingsForm } from "./TripSettingsForm";

export default function SettingsPage() {
  const { id } = useParams<{ id: string }>();
  const trip = useLiveQuery(() => db.trips.get(id), [id], undefined);

  if (trip === undefined) {
    return <main className="px-4 pt-4 text-sm text-[color:var(--muted)]">Loading…</main>;
  }
  if (!trip) {
    return <main className="px-4 pt-4 text-sm">Trip not found.</main>;
  }

  return (
    <main className="px-4 pt-2">
      <div className="flex items-center gap-2 mb-3">
        <Link href={`/trip/${id}/places`} className="text-sm text-[color:var(--muted)]">
          ← Back to trip
        </Link>
      </div>
      <h2 className="text-xl font-bold mb-3">Trip settings</h2>
      <TripSettingsForm trip={trip} />
    </main>
  );
}
