"use client";

import { db, newId, nowIso } from "@/lib/db";
import type { PackTemplate, PackTemplateItem } from "@/lib/types";

export async function createTemplate(name: string): Promise<PackTemplate> {
  const t: PackTemplate = {
    id: newId(),
    created_at: nowIso(),
    name,
  };
  await db.pack_templates.add(t);
  return t;
}

export async function deleteTemplate(id: string): Promise<void> {
  await db.transaction("rw", [db.pack_templates, db.pack_template_items], async () => {
    await db.pack_template_items.where("template_id").equals(id).delete();
    await db.pack_templates.delete(id);
  });
}

export async function createTemplateItem(input: {
  template_id: string;
  text: string;
  sort_order: number;
}): Promise<PackTemplateItem> {
  const item: PackTemplateItem = {
    id: newId(),
    ...input,
  };
  await db.pack_template_items.add(item);
  return item;
}

export async function updateTemplateItem(
  id: string,
  patch: Partial<Pick<PackTemplateItem, "text" | "sort_order">>,
): Promise<void> {
  await db.pack_template_items.update(id, patch);
}

export async function deleteTemplateItem(id: string): Promise<void> {
  await db.pack_template_items.delete(id);
}

export async function reorderTemplateItems(
  updates: { id: string; sort_order: number }[],
): Promise<void> {
  await db.transaction("rw", db.pack_template_items, async () => {
    await Promise.all(
      updates.map((u) => db.pack_template_items.update(u.id, { sort_order: u.sort_order })),
    );
  });
}
