"use client";

import { useMemo, useState } from "react";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { SortableList } from "@/components/SortableList";
import { AddSheet } from "@/components/AddSheet";
import type { Place, PlanItem, Trip } from "@/lib/types";
import {
  createPlanItems,
  deletePlanItem,
  reorderPlanItems,
} from "@/lib/actions/plan";

export function PlanTab({
  trip,
  places,
  initial,
  readOnly = false,
}: {
  trip: Trip;
  places: Place[];
  initial: PlanItem[];
  readOnly?: boolean;
}) {
  const [items, setItems] = useState<PlanItem[]>(initial);

  const days = useMemo(() => buildDays(trip.start_date, trip.end_date, items), [trip, items]);
  const [selected, setSelected] = useState<string>(days[0] ?? today());
  const [adding, setAdding] = useState(false);

  const dayItems = useMemo(
    () =>
      items
        .filter((i) => i.day_date === selected)
        .sort((a, b) => a.sort_order - b.sort_order),
    [items, selected],
  );

  async function addItems(picks: { place_id?: string; custom_title?: string }[]) {
    try {
      const created = await createPlanItems(
        picks.map((p, i) => ({
          trip_id: trip.id,
          day_date: selected,
          place_id: p.place_id ?? null,
          custom_title: p.custom_title ?? null,
          sort_order: dayItems.length + i,
        })),
      );
      setItems((s) => [...s, ...created]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Add failed");
    }
  }

  async function removeItem(id: string) {
    setItems((s) => s.filter((i) => i.id !== id));
    await deletePlanItem(id);
  }

  async function reorder(next: PlanItem[]) {
    const others = items.filter((i) => i.day_date !== selected);
    const merged = [...others, ...next.map((p, idx) => ({ ...p, sort_order: idx }))];
    setItems(merged);
    const updates = next
      .map((p, idx) => ({ id: p.id, sort_order: idx, prev: p.sort_order }))
      .filter((u) => u.prev !== u.sort_order)
      .map(({ id, sort_order }) => ({ id, sort_order }));
    if (updates.length > 0) await reorderPlanItems(updates);
  }

  return (
    <div>
      <div className="px-4 pt-3 pb-2 sticky top-[56px] z-10 bg-[color:var(--background)]">
        <div className="flex gap-2 overflow-x-auto py-1">
          {days.map((d) => {
            const date = parseISO(d);
            const active = d === selected;
            return (
              <button
                key={d}
                onClick={() => setSelected(d)}
                className={`shrink-0 px-3 py-2 rounded-xl text-center text-xs min-w-[64px] ${
                  active
                    ? "bg-[color:var(--accent)] text-white"
                    : "bg-[color:var(--card)] border border-[color:var(--card-border)]"
                }`}
              >
                <div className="opacity-80">{format(date, "EEE")}</div>
                <div className="text-lg font-semibold leading-tight">{format(date, "d")}</div>
                <div className="opacity-70">{format(date, "MMM")}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">
            {selected && format(parseISO(selected), "EEEE, MMM d")}
          </h3>
          {!readOnly && (
            <button onClick={() => setAdding(true)} className="btn btn-primary !min-h-0 !py-1.5 !px-3 text-sm">
              + Add
            </button>
          )}
        </div>

        {dayItems.length === 0 ? (
          <div className="card p-6 text-center text-sm text-[color:var(--muted)]">
            Nothing planned for this day.
          </div>
        ) : (
          <SortableList
            items={dayItems}
            onReorder={reorder}
            disabled={readOnly}
            renderItem={(item, handle) => {
              const place = item.place_id ? places.find((p) => p.id === item.place_id) : null;
              const title = place?.name ?? item.custom_title ?? "(untitled)";
              return (
                <div className="card p-3 flex items-center gap-1">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{title}</div>
                    {place && (
                      <div className="text-xs text-[color:var(--muted)]">
                        {place.category === "see" ? "📍 See" : "🍽 Eat"}
                      </div>
                    )}
                  </div>
                  {!readOnly && (
                    <>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="px-3 py-2 text-[color:var(--muted)]"
                        aria-label="Remove"
                      >
                        ✕
                      </button>
                      {handle}
                    </>
                  )}
                </div>
              );
            }}
          />
        )}
      </div>

      {!readOnly && (
        <AddSheet open={adding} onClose={() => setAdding(false)} title="Add to day">
          <AddPlanItemsForm
            places={places}
            onAdd={async (picks) => {
              await addItems(picks);
              setAdding(false);
            }}
          />
        </AddSheet>
      )}
    </div>
  );
}

function AddPlanItemsForm({
  places,
  onAdd,
}: {
  places: Place[];
  onAdd: (picks: { place_id?: string; custom_title?: string }[]) => Promise<void>;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [custom, setCustom] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    const picks: { place_id?: string; custom_title?: string }[] = [];
    for (const id of selected) picks.push({ place_id: id });
    if (custom.trim()) picks.push({ custom_title: custom.trim() });
    if (picks.length === 0) return;
    setSaving(true);
    await onAdd(picks);
    setSaving(false);
  }

  return (
    <div className="space-y-3">
      <input
        className="input"
        placeholder="Custom entry (e.g. Train to Kyoto)"
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
      />
      <div className="text-xs text-[color:var(--muted)] mt-2">Or pick from your places:</div>
      <div className="max-h-72 overflow-y-auto space-y-1 -mx-1 px-1">
        {places.length === 0 ? (
          <div className="text-sm text-[color:var(--muted)] py-3">
            No places yet — add some in the Places tab.
          </div>
        ) : (
          places.map((p) => (
            <label key={p.id} className="flex items-center gap-3 px-2 py-2 rounded-lg active:bg-black/5">
              <input
                type="checkbox"
                checked={selected.has(p.id)}
                onChange={(e) => {
                  const s = new Set(selected);
                  if (e.target.checked) s.add(p.id);
                  else s.delete(p.id);
                  setSelected(s);
                }}
                className="w-5 h-5"
              />
              <span className="text-sm">
                {p.category === "see" ? "📍" : "🍽"} {p.name}
              </span>
            </label>
          ))
        )}
      </div>
      <button
        onClick={submit}
        disabled={saving || (selected.size === 0 && !custom.trim())}
        className="btn btn-primary w-full"
      >
        {saving ? "Adding…" : `Add${selected.size > 0 ? ` (${selected.size + (custom.trim() ? 1 : 0)})` : ""}`}
      </button>
    </div>
  );
}

function today() {
  return format(new Date(), "yyyy-MM-dd");
}

function buildDays(start: string | null, end: string | null, items: PlanItem[]): string[] {
  const dates = new Set<string>();
  if (start && end) {
    const s = parseISO(start);
    const e = parseISO(end);
    const n = Math.max(0, differenceInCalendarDays(e, s));
    for (let i = 0; i <= n; i++) dates.add(format(addDays(s, i), "yyyy-MM-dd"));
  }
  for (const i of items) dates.add(i.day_date);
  if (dates.size === 0) dates.add(today());
  return Array.from(dates).sort();
}
