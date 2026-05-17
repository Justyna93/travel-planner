"use client";

import { useMemo, useState } from "react";
import { SortableList } from "@/components/SortableList";
import type { PackTemplate, PackTemplateItem } from "@/lib/types";
import {
  createTemplate,
  deleteTemplate,
  createTemplateItem,
  updateTemplateItem,
  deleteTemplateItem,
  reorderTemplateItems,
} from "@/lib/actions/templates";

export function TemplatesEditor({
  templates: initialTemplates,
  items: initialItems,
}: {
  templates: PackTemplate[];
  items: PackTemplateItem[];
}) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [items, setItems] = useState(initialItems);
  const [activeId, setActiveId] = useState<string | null>(initialTemplates[0]?.id ?? null);
  const [newName, setNewName] = useState("");
  const [draft, setDraft] = useState("");

  const active = templates.find((t) => t.id === activeId) ?? null;
  const activeItems = useMemo(
    () =>
      items
        .filter((i) => i.template_id === activeId)
        .sort((a, b) => a.sort_order - b.sort_order),
    [items, activeId],
  );

  async function add() {
    const n = newName.trim();
    if (!n) return;
    try {
      const t = await createTemplate(n);
      setTemplates((s) => [...s, t]);
      setActiveId(t.id);
      setNewName("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function removeTemplate(id: string) {
    if (!confirm("Delete this template?")) return;
    setTemplates((s) => s.filter((t) => t.id !== id));
    setItems((s) => s.filter((i) => i.template_id !== id));
    if (activeId === id) setActiveId(null);
    await deleteTemplate(id);
  }

  async function addItem() {
    if (!active) return;
    const t = draft.trim();
    if (!t) return;
    try {
      const item = await createTemplateItem({
        template_id: active.id,
        text: t,
        sort_order: activeItems.length,
      });
      setItems((s) => [...s, item]);
      setDraft("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Add failed");
    }
  }

  async function updateItem(id: string, patch: Partial<PackTemplateItem>) {
    setItems((s) => s.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    await updateTemplateItem(id, patch);
  }

  async function deleteItem(id: string) {
    setItems((s) => s.filter((i) => i.id !== id));
    await deleteTemplateItem(id);
  }

  async function reorder(next: PackTemplateItem[]) {
    const others = items.filter((i) => i.template_id !== activeId);
    setItems([...others, ...next.map((p, idx) => ({ ...p, sort_order: idx }))]);
    const updates = next
      .map((p, idx) => ({ id: p.id, sort_order: idx, prev: p.sort_order }))
      .filter((u) => u.prev !== u.sort_order)
      .map(({ id, sort_order }) => ({ id, sort_order }));
    if (updates.length > 0) await reorderTemplateItems(updates);
  }

  return (
    <div>
      <div className="flex gap-2 mb-3 overflow-x-auto">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveId(t.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm border ${
              t.id === activeId
                ? "bg-[color:var(--accent)] text-white border-transparent"
                : "border-[color:var(--card-border)]"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        className="flex gap-2 mb-4"
      >
        <input
          className="input flex-1"
          placeholder="New template name…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit" className="btn btn-primary !px-4">+ Template</button>
      </form>

      {active ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">{active.name}</h2>
            <button
              onClick={() => removeTemplate(active.id)}
              className="text-[color:var(--danger)] text-sm px-2"
            >
              Delete template
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              addItem();
            }}
            className="flex gap-2 mb-3"
          >
            <input
              className="input flex-1"
              placeholder="Add item…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button type="submit" className="btn btn-primary !px-4">Add</button>
          </form>

          {activeItems.length === 0 ? (
            <div className="card p-6 text-center text-sm text-[color:var(--muted)]">
              No items yet.
            </div>
          ) : (
            <SortableList
              items={activeItems}
              onReorder={reorder}
              renderItem={(item, handle) => (
                <div className="card p-3 flex items-center gap-2">
                  <input
                    className="flex-1 bg-transparent outline-none"
                    defaultValue={item.text}
                    onBlur={(e) => {
                      const v = e.target.value;
                      if (v !== item.text) updateItem(item.id, { text: v });
                    }}
                  />
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="px-2 py-2 text-[color:var(--muted)]"
                    aria-label="Delete"
                  >
                    ✕
                  </button>
                  {handle}
                </div>
              )}
            />
          )}
        </div>
      ) : (
        <div className="card p-6 text-center text-sm text-[color:var(--muted)]">
          Create your first template to reuse it across trips.
        </div>
      )}
    </div>
  );
}
