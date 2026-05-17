"use client";

import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { PlanTab } from "@/components/tabs/PlanTab";

export default function PlanPage() {
  const { id } = useParams<{ id: string }>();

  const data = useLiveQuery(
    async () => {
      const trip = await db.trips.get(id);
      if (!trip) return { trip: null, places: [], plan: [] };
      const [places, plan] = await Promise.all([
        db.places.where("trip_id").equals(id).sortBy("sort_order"),
        db.plan_items.where("trip_id").equals(id).sortBy("sort_order"),
      ]);
      return { trip, places, plan };
    },
    [id],
    null,
  );

  if (data === null) {
    return <div className="px-4 pt-4 text-sm text-[color:var(--muted)]">Loading…</div>;
  }
  if (!data.trip) {
    return <div className="px-4 pt-4 text-sm">Trip not found.</div>;
  }

  return <PlanTab trip={data.trip} places={data.places} initial={data.plan} />;
}
