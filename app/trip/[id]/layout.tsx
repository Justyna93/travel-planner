"use client";

import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { BottomTabs } from "@/components/BottomTabs";
import { TripHeader } from "@/components/TripHeader";

export default function TripLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const trip = useLiveQuery(() => db.trips.get(id), [id], undefined);

  if (trip === undefined) {
    return (
      <div className="flex-1 px-4 py-6 text-sm text-[color:var(--muted)]">Loading…</div>
    );
  }

  if (trip === null || !trip) {
    return (
      <div className="flex-1 px-4 py-6">
        <p className="text-sm">Trip not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-full">
      <TripHeader trip={trip} backHref="/" />
      <div className="flex-1 pb-[calc(env(safe-area-inset-bottom)+72px)]">{children}</div>
      <BottomTabs base={`/trip/${trip.id}`} />
    </div>
  );
}
