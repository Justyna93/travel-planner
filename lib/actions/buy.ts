"use client";

import { db, newId, nowIso } from "@/lib/db";
import type { BuyItem, BuyListType } from "@/lib/types";

export async function createBuyItem(input: {
  trip_id: string;
  list_type: BuyListType;
  text: string;
  sort_order: number;
}): Promise<BuyItem> {
  const item: BuyItem = {
    id: newId(),
    created_at: nowIso(),
    checked: false,
    ...input,
  };
  await db.buy_items.add(item);
  return item;
}

export async function updateBuyItem(
  id: string,
  patch: Partial<Pick<BuyItem, "text" | "checked" | "sort_order">>,
): Promise<void> {
  await db.buy_items.update(id, patch);
}

export async function deleteBuyItem(id: string): Promise<void> {
  await db.buy_items.delete(id);
}

export async function reorderBuyItems(
  updates: { id: string; sort_order: number }[],
): Promise<void> {
  await db.transaction("rw", db.buy_items, async () => {
    await Promise.all(
      updates.map((u) => db.buy_items.update(u.id, { sort_order: u.sort_order })),
    );
  });
}
