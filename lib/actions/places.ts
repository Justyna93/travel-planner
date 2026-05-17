"use client";

import { db, newId, nowIso } from "@/lib/db";
import type { Place } from "@/lib/types";

export async function createPlace(input: {
  trip_id: string;
  name: string;
  category: "see" | "eat";
  priority: number;
  sort_order: number;
}): Promise<Place> {
  const place: Place = {
    id: newId(),
    created_at: nowIso(),
    notes: "",
    ...input,
  };
  await db.places.add(place);
  return place;
}

export async function updatePlace(id: string, patch: Partial<Place>): Promise<void> {
  const { id: _i, created_at: _c, ...data } = patch as Partial<Place> & {
    id?: string;
    created_at?: string;
  };
  void _i;
  void _c;
  await db.places.update(id, data);
}

export async function deletePlace(id: string): Promise<void> {
  await db.places.delete(id);
}

export async function reorderPlaces(updates: { id: string; sort_order: number }[]): Promise<void> {
  await db.transaction("rw", db.places, async () => {
    await Promise.all(updates.map((u) => db.places.update(u.id, { sort_order: u.sort_order })));
  });
}
