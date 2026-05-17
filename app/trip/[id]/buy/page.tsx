"use client";

import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { BuyTab } from "@/components/tabs/BuyTab";

export default function BuyPage() {
  const { id } = useParams<{ id: string }>();
  const items = useLiveQuery(
    () => db.buy_items.where("trip_id").equals(id).sortBy("sort_order"),
    [id],
    null,
  );

  if (items === null) {
    return <div className="px-4 pt-4 text-sm text-[color:var(--muted)]">Loading…</div>;
  }

  return <BuyTab tripId={id} initial={items} />;
}
