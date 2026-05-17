"use client";

import { db, newId, nowIso } from "@/lib/db";
import type { PlanItem } from "@/lib/types";

export async function createPlanItems(
  inputs: {
    trip_id: string;
    day_date: string;
    place_id: string | null;
    custom_title: string | null;
    sort_order: number;
  }[],
): Promise<PlanItem[]> {
  const now = nowIso();
  const rows: PlanItem[] = inputs.map((data) => ({
    id: newId(),
    created_at: now,
    ...data,
  }));
  await db.plan_items.bulkAdd(rows);
  return rows;
}

export async function deletePlanItem(id: string): Promise<void> {
  await db.plan_items.delete(id);
}

export async function reorderPlanItems(
  updates: { id: string; sort_order: number }[],
): Promise<void> {
  await db.transaction("rw", db.plan_items, async () => {
    await Promise.all(
      updates.map((u) => db.plan_items.update(u.id, { sort_order: u.sort_order })),
    );
  });
}
