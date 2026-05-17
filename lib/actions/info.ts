"use client";

import { db, newId, nowIso } from "@/lib/db";
import type { InfoItem } from "@/lib/types";

export async function createInfoItem(input: {
  trip_id: string;
  title: string;
  description: string;
  image_id: string | null;
  sort_order: number;
}): Promise<InfoItem> {
  const item: InfoItem = {
    id: newId(),
    created_at: nowIso(),
    ...input,
  };
  await db.info_items.add(item);
  return item;
}

export async function updateInfoItem(
  id: string,
  patch: Partial<Pick<InfoItem, "title" | "description" | "image_id" | "sort_order">>,
): Promise<InfoItem> {
  await db.info_items.update(id, patch);
  const updated = await db.info_items.get(id);
  if (!updated) throw new Error("Info item disappeared");
  return updated;
}

export async function deleteInfoItem(id: string): Promise<void> {
  const item = await db.info_items.get(id);
  await db.info_items.delete(id);
  if (item?.image_id) {
    // Clean up the blob — InfoItems are the only consumer.
    await db.info_images.delete(item.image_id);
  }
}

export async function reorderInfoItems(
  updates: { id: string; sort_order: number }[],
): Promise<void> {
  await db.transaction("rw", db.info_items, async () => {
    await Promise.all(
      updates.map((u) => db.info_items.update(u.id, { sort_order: u.sort_order })),
    );
  });
}

// Stores the image blob locally; returns the id to store on the info item.
export async function uploadInfoImage(formData: FormData): Promise<string | null> {
  const file = formData.get("file");
  if (!(file instanceof File)) return null;
  const id = newId();
  await db.info_images.add({
    id,
    blob: file,
    name: file.name,
    type: file.type,
    created_at: nowIso(),
  });
  return id;
}
