"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Trip } from "@/lib/types";
import { updateTrip, deleteTrip } from "@/lib/actions/trips";

export function TripSettingsForm({ trip }: { trip: Trip }) {
  const router = useRouter();
  const [name, setName] = useState(trip.name);
  const [destination, setDestination] = useState(trip.destination);
  const [start, setStart] = useState(trip.start_date ?? "");
  const [end, setEnd] = useState(trip.end_date ?? "");
  const [, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateTrip(trip.id, {
        name: name.trim(),
        destination: destination.trim(),
        start_date: start || null,
        end_date: end || null,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function onDelete() {
    if (!confirm(`Delete "${trip.name}" and all its data? This cannot be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteTrip(trip.id);
        router.push("/");
      } catch (err) {
        alert(err instanceof Error ? err.message : "Delete failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="space-y-3">
        <div>
          <label className="text-sm text-[color:var(--muted)]">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm text-[color:var(--muted)]">Destination</label>
          <input
            className="input"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm text-[color:var(--muted)]">From</label>
            <input type="date" className="input" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-[color:var(--muted)]">To</label>
            <input type="date" className="input" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <button disabled={saving} className="btn btn-primary w-full">
          {saving ? "Saving…" : "Save"}
        </button>
      </form>

      <section>
        <h3 className="font-semibold mb-2 text-[color:var(--danger)]">Danger zone</h3>
        <button onClick={onDelete} className="btn btn-danger w-full">
          Delete this trip
        </button>
      </section>
    </div>
  );
}
