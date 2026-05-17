"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AddSheet } from "@/components/AddSheet";
import { createTrip } from "@/lib/actions/trips";

export function HomeActions() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const trip = await createTrip({
          name: name.trim(),
          destination: destination.trim(),
          start_date: start || null,
          end_date: end || null,
        });
        setOpen(false);
        setName("");
        setDestination("");
        setStart("");
        setEnd("");
        router.push(`/trip/${trip.id}/places`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create trip");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Add destination"
        className="fixed right-5 bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] z-40 btn btn-primary rounded-full h-14 w-14 text-2xl shadow-lg"
      >
        +
      </button>

      <AddSheet open={open} onClose={() => setOpen(false)} title="New destination">
        <form onSubmit={onCreate} className="space-y-3">
          <div>
            <label className="text-sm text-[color:var(--muted)]">Trip name</label>
            <input
              className="input"
              placeholder="Tokyo with family"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm text-[color:var(--muted)]">Destination</label>
            <input
              className="input"
              placeholder="Japan"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-[color:var(--muted)]">From</label>
              <input type="date" className="input" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-[color:var(--muted)]">To</label>
              <input type="date" className="input" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm text-[color:var(--danger)]">{error}</p>}
          <button type="submit" disabled={isPending || !name.trim()} className="btn btn-primary w-full mt-2">
            {isPending ? "Creating…" : "Create trip"}
          </button>
        </form>
      </AddSheet>
    </>
  );
}
