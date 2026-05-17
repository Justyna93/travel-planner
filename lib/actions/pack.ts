"use client";

import { db, newId, nowIso } from "@/lib/db";
import type { PackItem, PackList } from "@/lib/types";

export async function createPackList(input: {
  trip_id: string;
  name: string;
  template_id: string | null;
  sort_order: number;
}): Promise<{ list: PackList; items: PackItem[] }> {
  const now = nowIso();
  const list: PackList = {
    id: newId(),
    created_at: now,
    ...input,
  };

  let items: PackItem[] = [];

  await db.transaction("rw", [db.pack_lists, db.pack_template_items, db.pack_items], async () => {
    await db.pack_lists.add(list);
    if (input.template_id) {
      const tplItems = await db.pack_template_items
        .where("template_id")
        .equals(input.template_id)
        .sortBy("sort_order");
      items = tplItems.map((t, i) => ({
        id: newId(),
        list_id: list.id,
        text: t.text,
        checked: false,
        sort_order: i,
      }));
      if (items.length > 0) await db.pack_items.bulkAdd(items);
    }
  });

  return { list, items };
}

export async function deletePackList(id: string): Promise<void> {
  await db.transaction("rw", [db.pack_lists, db.pack_items], async () => {
    await db.pack_items.where("list_id").equals(id).delete();
    await db.pack_lists.delete(id);
  });
}

export async function createPackItem(input: {
  list_id: string;
  text: string;
  sort_order: number;
}): Promise<PackItem> {
  const item: PackItem = {
    id: newId(),
    checked: false,
    ...input,
  };
  await db.pack_items.add(item);
  return item;
}

export async function updatePackItem(
  id: string,
  patch: Partial<Pick<PackItem, "text" | "checked" | "sort_order">>,
): Promise<void> {
  await db.pack_items.update(id, patch);
}

export async function deletePackItem(id: string): Promise<void> {
  await db.pack_items.delete(id);
}

export async function reorderPackItems(
  updates: { id: string; sort_order: number }[],
): Promise<void> {
  await db.transaction("rw", db.pack_items, async () => {
    await Promise.all(
      updates.map((u) => db.pack_items.update(u.id, { sort_order: u.sort_order })),
    );
  });
}

