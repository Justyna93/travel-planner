"use client";

import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { PackTab, type PackListWithItems } from "@/components/tabs/PackTab";

export default function PackPage() {
  const { id } = useParams<{ id: string }>();

  const data = useLiveQuery(
    async () => {
      const lists = await db.pack_lists.where("trip_id").equals(id).sortBy("sort_order");
      const listIds = lists.map((l) => l.id);
      const items =
        listIds.length > 0
          ? await db.pack_items.where("list_id").anyOf(listIds).toArray()
          : [];
      const [templates, templateItems] = await Promise.all([
        db.pack_templates.orderBy("created_at").toArray(),
        db.pack_template_items.orderBy("sort_order").toArray(),
      ]);
      const listsWithItems: PackListWithItems[] = lists.map((l) => ({
        ...l,
        items: items.filter((i) => i.list_id === l.id),
      }));
      return { listsWithItems, templates, templateItems };
    },
    [id],
    null,
  );

  if (data === null) {
    return <div className="px-4 pt-4 text-sm text-[color:var(--muted)]">Loading…</div>;
  }

  return (
    <PackTab
      tripId={id}
      initialLists={data.listsWithItems}
      templates={data.templates}
      templateItems={data.templateItems}
    />
  );
}
