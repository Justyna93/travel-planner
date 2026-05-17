"use client";

import { useMemo, useState } from "react";
import { SortableList } from "@/components/SortableList";
import type { BuyItem, BuyListType } from "@/lib/types";
import {
  createBuyItem,
  updateBuyItem,
  deleteBuyItem,
  reorderBuyItems,
} from "@/lib/actions/buy";

export function BuyTab({
  tripId,
  initial,
  readOnly = false,
}: {
  tripId: string;
  initial: BuyItem[];
  readOnly?: boolean;
}) {
  const [items, setItems] = useState<BuyItem[]>(initial);
  const [tab, setTab] = useState<BuyListType>("before");
  const [draft, setDraft] = useState("");

  const visible = useMemo(
    () =>
      items
        .filter((i) => i.list_type === tab)
        .sort((a, b) => a.sort_order - b.sort_order),
    [items, tab],
  );

  async function add() {
    const t = draft.trim();
    if (!t) return;
    try {
      const item = await createBuyItem({
        trip_id: tripId,
        list_type: tab,
        text: t,
        sort_order: visible.length,
      });
      setItems((s) => [...s, item]);
      setDraft("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Add failed");
    }
  }

  async function update(id: string, patch: Partial<BuyItem>) {
    setItems((s) => s.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    await updateBuyItem(id, patch);
  }

  async function del(id: string) {
    setItems((s) => s.filter((i) => i.id !== id));
    await deleteBuyItem(id);
  }

  async function reorder(next: BuyItem[]) {
    const others = items.filter((i) => i.list_type !== tab);
    const merged = [...others, ...next.map((p, idx) => ({ ...p, sort_order: idx }))];
    setItems(merged);
    const updates = next
      .map((p, idx) => ({ id: p.id, sort_order: idx, prev: p.sort_order }))
      .filter((u) => u.prev !== u.sort_order)
      .map(({ id, sort_order }) => ({ id, sort_order }));
    if (updates.length > 0) await reorderBuyItems(updates);
  }

  return (
    <div className="px-4 pt-3">
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => setTab("before")}
          className={`btn ${tab === "before" ? "btn-primary" : "btn-ghost border border-[color:var(--card-border)]"}`}
        >
          Before trip
        </button>
        <button
          onClick={() => setTab("there")}
          className={`btn ${tab === "there" ? "btn-primary" : "btn-ghost border border-[color:var(--card-border)]"}`}
        >
          Buy there
        </button>
      </div>

      {!readOnly && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
          className="flex gap-2 mb-3"
        >
          <input
            className="input flex-1"
            placeholder={tab === "before" ? "Add something to buy before…" : "Add something to buy there…"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="btn btn-primary !px-4">
            Add
          </button>
        </form>
      )}

      {visible.length === 0 ? (
        <div className="card p-6 text-center text-sm text-[color:var(--muted)]">
          Nothing on this list yet.
        </div>
      ) : (
        <SortableList
          items={visible}
          onReorder={reorder}
          disabled={readOnly}
          renderItem={(item, handle) => (
            <div className="card p-3 flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.checked}
                disabled={readOnly}
                onChange={(e) => update(item.id, { checked: e.target.checked })}
                className="w-5 h-5 shrink-0"
              />
              {readOnly ? (
                <span
                  className={`flex-1 ${item.checked ? "line-through text-[color:var(--muted)]" : ""}`}
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
                    if (v !== item.text) update(item.id, { text: v });
                  }}
                />
              )}
              {!readOnly && (
                <>
                  <button onClick={() => del(item.id)} className="px-2 py-2 text-[color:var(--muted)]" aria-label="Delete">
                    ✕
                  </button>
                  {handle}
                </>
              )}
            </div>
          )}
        />
      )}
    </div>
  );
}
