"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { TemplatesEditor } from "./TemplatesEditor";

export default function TemplatesPage() {
  const data = useLiveQuery(
    async () => {
      const [templates, items] = await Promise.all([
        db.pack_templates.orderBy("created_at").toArray(),
        db.pack_template_items.orderBy("sort_order").toArray(),
      ]);
      return { templates, items };
    },
    [],
    null,
  );

  return (
    <main className="flex-1 px-4 safe-pt pb-24">
      <header className="flex items-center gap-2 py-2">
        <Link href="/" className="px-2 py-2 text-lg">
          ←
        </Link>
        <h1 className="text-xl font-bold flex-1">Pack list templates</h1>
      </header>
      <p className="text-sm text-[color:var(--muted)] mb-4">
        Reusable lists you can copy into any trip (e.g. &quot;Me&quot;, &quot;Child&quot;, &quot;Toiletries&quot;).
      </p>
      {data === null ? (
        <div className="text-sm text-[color:var(--muted)]">Loading…</div>
      ) : (
        <TemplatesEditor templates={data.templates} items={data.items} />
      )}
    </main>
  );
}
