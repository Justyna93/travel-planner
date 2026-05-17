"use client";

import { db, newId, nowIso } from "@/lib/db";
import type { Trip } from "@/lib/types";

export async function createTrip(input: {
  name: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
}): Promise<Trip> {
  const trip: Trip = {
    id: newId(),
    created_at: nowIso(),
    name: input.name,
    destination: input.destination,
    start_date: input.start_date,
    end_date: input.end_date,
    cover_color: null,
  };
  await db.trips.add(trip);
  return trip;
}

export async function updateTrip(
  id: string,
  patch: Partial<Pick<Trip, "name" | "destination" | "start_date" | "end_date" | "cover_color">>,
): Promise<void> {
  await db.trips.update(id, patch);
}

export async function deleteTrip(id: string): Promise<void> {
  // Cascade: remove every child row that references this trip, plus pack-list children.
  await db.transaction(
    "rw",
    [
      db.trips,
      db.places,
      db.info_items,
      db.info_images,
      db.plan_items,
      db.buy_items,
      db.pack_lists,
      db.pack_items,
    ],
    async () => {
      const infoItems = await db.info_items.where("trip_id").equals(id).toArray();
      const orphanImageIds = infoItems
        .map((i) => i.image_id)
        .filter((x): x is string => !!x);
      if (orphanImageIds.length > 0) {
        await db.info_images.bulkDelete(orphanImageIds);
      }

      const lists = await db.pack_lists.where("trip_id").equals(id).toArray();
      const listIds = lists.map((l) => l.id);
      if (listIds.length > 0) {
        await db.pack_items.where("list_id").anyOf(listIds).delete();
      }

      await Promise.all([
        db.places.where("trip_id").equals(id).delete(),
        db.info_items.where("trip_id").equals(id).delete(),
        db.plan_items.where("trip_id").equals(id).delete(),
        db.buy_items.where("trip_id").equals(id).delete(),
        db.pack_lists.where("trip_id").equals(id).delete(),
        db.trips.delete(id),
      ]);
    },
  );
}
