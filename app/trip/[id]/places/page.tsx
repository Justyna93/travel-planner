"use client";

import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { PlacesTab } from "@/components/tabs/PlacesTab";

export default function PlacesPage() {
  const { id } = useParams<{ id: string }>();
  const places = useLiveQuery(
    () => db.places.where("trip_id").equals(id).sortBy("sort_order"),
    [id],
    null,
  );

  if (places === null) {
    return <div className="px-4 pt-4 text-sm text-[color:var(--muted)]">Loading…</div>;
  }

  return <PlacesTab tripId={id} initial={places} />;
}
