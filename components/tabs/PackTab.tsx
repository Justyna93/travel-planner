"use client";

import { useMemo, useState } from "react";
import { SortableList } from "@/components/SortableList";
import { AddSheet } from "@/components/AddSheet";
import type {
  PackItem,
  PackList,
  PackTemplate,
  PackTemplateItem,
} from "@/lib/types";
import {
  createPackList,
  deletePackList,
  createPackItem,
  updatePackItem,
  deletePackItem,
  reorderPackItems,
} from "@/lib/actions/pack";

export type PackListWithItems = PackList & { items: PackItem[] };

export function PackTab({
  tripId,
  initialLists,
  templates,
  templateItems: _templateItems,
  readOnly = false,
}: {
  tripId: string;
  initialLists: PackListWithItems[];
  templates: PackTemplate[];
  templateItems: PackTemplateItem[];
  readOnly?: boolean;
}) {
  void _templateItems;
  const [lists, setLists] = useState<PackListWithItems[]>(initialLists);
  const [activeId, setActiveId] = useState<string | null>(initialLists[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");

  const active = useMemo(() => lists.find((l) => l.id === activeId) ?? null, [lists, activeId]);
  const itemsSorted = useMemo(
    () => (active ? [...active.items].sort((a, b) => a.sort_order - b.sort_order) : []),
    [active],
  );

  async function createList(name: string, templateId: string | null) {
    try {
      const { list, items } = await createPackList({
        trip_id: tripId,
        name,
        template_id: templateId,
        sort_order: lists.length,
      });
      setLists((s) => [...s, { ...list, items }]);
      setActiveId(list.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function deleteList(id: string) {
    if (!confirm("Delete this list and all its items?")) return;
    setLists((s) => s.filter((l) => l.id !== id));
    if (activeId === id) setActiveId(lists.find((l) => l.id !== id)?.id ?? null);
    await deletePackList(id);
  }

  async function addItem() {
    if (!active) return;
    const t = draft.trim();
    if (!t) return;
    try {
      const item = await createPackItem({
        list_id: active.id,
        text: t,
        sort_order: active.items.length,
      });
      setLists((s) =>
        s.map((l) => (l.id === active.id ? { ...l, items: [...l.items, item] } : l)),
      );
      setDraft("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Add failed");
    }
  }

  async function updateItem(itemId: string, patch: Partial<PackItem>) {
    setLists((s) =>
      s.map((l) =>
        l.id === active?.id
          ? { ...l, items: l.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }
          : l,
      ),
    );
    await updatePackItem(itemId, patch);
  }

  async function deleteItem(itemId: string) {
    if (!active) return;
    setLists((s) =>
      s.map((l) =>
        l.id === active.id ? { ...l, items: l.items.filter((i) => i.id !== itemId) } : l,
      ),
    );
    await deletePackItem(itemId);
  }

  async function reorderItems(next: PackItem[]) {
    if (!active) return;
    setLists((s) =>
      s.map((l) =>
        l.id === active.id
          ? { ...l, items: next.map((p, idx) => ({ ...p, sort_order: idx })) }
          : l,
      ),
    );
    const updates = next
      .map((p, idx) => ({ id: p.id, sort_order: idx, prev: p.sort_order }))
      .filter((u) => u.prev !== u.sort_order)
      .map(({ id, sort_order }) => ({ id, sort_order }));
    if (updates.length > 0) await reorderPackItems(updates);
  }

  return (
    <div className="px-4 pt-3">
      <div className="flex gap-2 mb-3 overflow-x-auto">
        {lists.map((l) => (
          <button
            key={l.id}
            onClick={() => setActiveId(l.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm border ${
              l.id === activeId
                ? "bg-[color:var(--accent)] text-white border-transparent"
                : "border-[color:var(--card-border)]"
            }`}
          >
            {l.name}
          </button>
        ))}
        {!readOnly && (
          <button
            onClick={() => setCreating(true)}
            className="shrink-0 px-3 py-1.5 rounded-full text-sm border border-dashed border-[color:var(--card-border)]"
          >
            + List
          </button>
        )}
      </div>

      {active ? (
        <>
          {!readOnly && (
            <div className="flex items-center justify-between mb-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addItem();
                }}
                className="flex gap-2 flex-1"
              >
                <input
                  className="input flex-1"
                  placeholder={`Add to ${active.name}…`}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit" className="btn btn-primary !px-4">Add</button>
              </form>
              <button
                onClick={() => deleteList(active.id)}
                className="ml-2 text-[color:var(--danger)] text-sm px-2"
                aria-label="Delete list"
              >
                🗑
              </button>
            </div>
          )}

          {itemsSorted.length === 0 ? (
            <div className="card p-6 text-center text-sm text-[color:var(--muted)]">
              Empty list.
            </div>
          ) : (
            <SortableList
              items={itemsSorted}
              onReorder={reorderItems}
              disabled={readOnly}
              renderItem={(item, handle) => (
                <div className="card p-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    disabled={readOnly}
                    onChange={(e) => updateItem(item.id, { checked: e.target.checked })}
                    className="w-5 h-5 shrink-0"
                  />
                  {readOnly ? (
                    <span
                      className={`flex-1 ${
                        item.checked ? "line-through text-[color:var(--muted)]" : ""
                      }`}
                    >
                      {item.text}
                    </span>
                  ) : (
                    <input
                      className={`flex-1 bg-transparent outline-none ${
                        item.checked ? "line-through text-[color:var(--muted)]" : ""
                      }`}
                      defaultValue={item.text}
                      onBlur={(e) => {
                        const v = e.target.value;
                        if (v !== item.text) updateItem(item.id, { text: v });
                      }}
                    />
                  )}
                  {!readOnly && (
                    <>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="px-2 py-2 text-[color:var(--muted)]"
                        aria-label="Delete"
                      >
                        ✕
                      </button>
                      {handle}
                    </>
                  )}
                </div>
              )}
            />
          )}
        </>
      ) : (
        <div className="card p-6 text-center text-sm text-[color:var(--muted)]">
          No pack lists yet.{" "}
          {!readOnly && (
            <button onClick={() => setCreating(true)} className="text-[color:var(--accent)] underline">
              Create one
            </button>
          )}
        </div>
      )}

      {!readOnly && (
        <AddSheet open={creating} onClose={() => setCreating(false)} title="New pack list">
          <NewListForm
            templates={templates}
            onCreate={async (name, templateId) => {
              await createList(name, templateId);
              setCreating(false);
            }}
          />
        </AddSheet>
      )}
    </div>
  );
}

function NewListForm({
  templates,
  onCreate,
}: {
  templates: PackTemplate[];
  onCreate: (name: string, templateId: string | null) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [tplId, setTplId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        await onCreate(name.trim(), tplId || null);
        setSaving(false);
      }}
      className="space-y-3"
    >
      <div>
        <label className="text-sm text-[color:var(--muted)]">List name</label>
        <input
          className="input"
          placeholder="Me / Child / Toiletries…"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="text-sm text-[color:var(--muted)]">Start from template (optional)</label>
        <select className="input" value={tplId} onChange={(e) => setTplId(e.target.value)}>
          <option value="">Blank list</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={saving} className="btn btn-primary w-full">
        {saving ? "Creating…" : "Create list"}
      </button>
    </form>
  );
}
