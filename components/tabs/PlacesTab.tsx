"use client";

import { useMemo, useState } from "react";
import { SortableList } from "@/components/SortableList";
import { AddSheet } from "@/components/AddSheet";
import type { Place, PlaceCategory } from "@/lib/types";
import {
  createPlace,
  updatePlace,
  deletePlace,
  reorderPlaces,
} from "@/lib/actions/places";

type Filter = "all" | "see" | "eat";

const PRIORITY_LABELS = ["—", "Optional", "Maybe", "Interesting", "Highly want", "Must-see"];

export function PlacesTab({
  tripId,
  initial,
  readOnly = false,
}: {
  tripId: string;
  initial: Place[];
  readOnly?: boolean;
}) {
  const [places, setPlaces] = useState<Place[]>(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [adding, setAdding] = useState(false);

  const visible = useMemo(() => {
    const arr = filter === "all" ? places : places.filter((p) => p.category === filter);
    return [...arr].sort((a, b) => a.sort_order - b.sort_order);
  }, [places, filter]);

  async function addPlace(name: string, category: PlaceCategory, priority: number) {
    try {
      const place = await createPlace({
        trip_id: tripId,
        name,
        category,
        priority,
        sort_order: places.length,
      });
      setPlaces((p) => [...p, place]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add place");
    }
  }

  async function updateLocal(id: string, patch: Partial<Place>) {
    setPlaces((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    try {
      await updatePlace(id, patch);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function removePlace(id: string) {
    if (!confirm("Delete this place?")) return;
    setPlaces((p) => p.filter((x) => x.id !== id));
    await deletePlace(id);
  }

  async function onReorder(next: Place[]) {
    const merged = mergeReorder(places, next, filter);
    setPlaces(merged);
    const updates = merged
      .map((p, idx) => ({ id: p.id, sort_order: idx, prev: p.sort_order }))
      .filter((u) => u.prev !== u.sort_order)
      .map(({ id, sort_order }) => ({ id, sort_order }));
    if (updates.length > 0) await reorderPlaces(updates);
    setPlaces(merged.map((p, idx) => ({ ...p, sort_order: idx })));
  }

  return (
    <div className="px-4 pt-3">
      <div className="flex gap-2 mb-3 overflow-x-auto">
        {(["all", "see", "eat"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              filter === f
                ? "bg-[color:var(--accent)] text-white border-transparent"
                : "border-[color:var(--card-border)]"
            }`}
          >
            {f === "all" ? "All" : f === "see" ? "To see" : "To eat"}
          </button>
        ))}
        {!readOnly && (
          <button
            onClick={() => setAdding(true)}
            className="ml-auto btn btn-primary !min-h-0 !py-1.5 !px-3 text-sm"
          >
            + Add
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="card p-6 text-center text-sm text-[color:var(--muted)]">
          No places yet.
        </div>
      ) : (
        <SortableList
          items={visible}
          onReorder={onReorder}
          disabled={readOnly}
          renderItem={(p, handle) => (
            <PlaceRow
              place={p}
              handle={handle}
              readOnly={readOnly}
              onUpdate={(patch) => updateLocal(p.id, patch)}
              onDelete={() => removePlace(p.id)}
            />
          )}
        />
      )}

      {!readOnly && (
        <AddSheet open={adding} onClose={() => setAdding(false)} title="Add a place">
          <AddPlaceForm
            onAdd={async (name, category, priority) => {
              await addPlace(name, category, priority);
              setAdding(false);
            }}
          />
        </AddSheet>
      )}
    </div>
  );
}

function PlaceRow({
  place,
  handle,
  readOnly,
  onUpdate,
  onDelete,
}: {
  place: Place;
  handle: React.ReactNode;
  readOnly: boolean;
  onUpdate: (patch: Partial<Place>) => void;
  onDelete: () => void;
}) {
  const [notes, setNotes] = useState(place.notes);
  const [name, setName] = useState(place.name);
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="card p-3">
      <div className="flex items-start gap-1">
        <div className="flex-1 min-w-0">
          {readOnly ? (
            <div className="font-medium">{place.name}</div>
          ) : (
            <input
              className="w-full bg-transparent font-medium outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => name !== place.name && onUpdate({ name })}
            />
          )}
          <div className="flex items-center gap-2 mt-1 text-xs text-[color:var(--muted)]">
            <span>{place.category === "see" ? "📍 See" : "🍽 Eat"}</span>
            <span>·</span>
            <span>{PRIORITY_LABELS[place.priority] ?? PRIORITY_LABELS[3]}</span>
          </div>
        </div>
        {!readOnly && (
          <>
            <button
              onClick={() => setShowActions((v) => !v)}
              className="px-2 py-2 text-[color:var(--muted)]"
              aria-label="More"
            >
              ⋯
            </button>
            {handle}
          </>
        )}
      </div>

      {readOnly ? (
        place.notes && (
          <p className="mt-2 text-sm text-[color:var(--muted)] whitespace-pre-wrap">{place.notes}</p>
        )
      ) : (
        <textarea
          className="w-full mt-2 bg-transparent text-sm text-[color:var(--muted)] outline-none resize-none"
          placeholder="Notes…"
          rows={notes ? Math.min(6, Math.max(2, notes.split("\n").length)) : 2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== place.notes && onUpdate({ notes })}
        />
      )}

      {showActions && !readOnly && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <select
            className="input !min-h-0 !py-1 text-sm flex-1"
            value={place.priority}
            onChange={(e) => onUpdate({ priority: Number(e.target.value) })}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}★ {PRIORITY_LABELS[n]}
              </option>
            ))}
          </select>
          <select
            className="input !min-h-0 !py-1 text-sm"
            value={place.category}
            onChange={(e) => onUpdate({ category: e.target.value as PlaceCategory })}
          >
            <option value="see">See</option>
            <option value="eat">Eat</option>
          </select>
          <button onClick={onDelete} className="btn btn-danger !min-h-0 !py-1 !px-3 text-sm">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function AddPlaceForm({
  onAdd,
}: {
  onAdd: (name: string, category: PlaceCategory, priority: number) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<PlaceCategory>("see");
  const [priority, setPriority] = useState(3);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onAdd(name.trim(), category, priority);
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        className="input"
        placeholder="Place name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        required
      />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setCategory("see")}
          className={`btn ${category === "see" ? "btn-primary" : "btn-ghost border border-[color:var(--card-border)]"}`}
        >
          📍 To see
        </button>
        <button
          type="button"
          onClick={() => setCategory("eat")}
          className={`btn ${category === "eat" ? "btn-primary" : "btn-ghost border border-[color:var(--card-border)]"}`}
        >
          🍽 To eat
        </button>
      </div>
      <label className="text-sm text-[color:var(--muted)] block">
        Priority: {PRIORITY_LABELS[priority]}
      </label>
      <input
        type="range"
        min={1}
        max={5}
        value={priority}
        onChange={(e) => setPriority(Number(e.target.value))}
        className="w-full"
      />
      <button type="submit" disabled={saving} className="btn btn-primary w-full">
        {saving ? "Adding…" : "Add place"}
      </button>
    </form>
  );
}

function mergeReorder(all: Place[], visibleReordered: Place[], filter: Filter): Place[] {
  if (filter === "all") return visibleReordered;
  const result: Place[] = [];
  let vi = 0;
  for (const p of all) {
    if (p.category === filter) {
      result.push(visibleReordered[vi++]);
    } else {
      result.push(p);
    }
  }
  return result;
}
