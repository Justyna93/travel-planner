import Link from "next/link";
import { format, parseISO } from "date-fns";
import type { Trip } from "@/lib/types";

const PALETTE = [
  "linear-gradient(135deg,#60a5fa,#2563eb)",
  "linear-gradient(135deg,#f472b6,#db2777)",
  "linear-gradient(135deg,#34d399,#059669)",
  "linear-gradient(135deg,#fbbf24,#d97706)",
  "linear-gradient(135deg,#a78bfa,#6d28d9)",
  "linear-gradient(135deg,#fb7185,#be123c)",
];

function colorFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function formatRange(start: string | null, end: string | null) {
  if (!start && !end) return "Dates not set";
  const s = start ? format(parseISO(start), "MMM d") : "";
  const e = end ? format(parseISO(end), "MMM d, yyyy") : "";
  if (s && e) return `${s} – ${e}`;
  return s || e;
}

export function TripCard({ trip }: { trip: Trip }) {
  const bg = trip.cover_color ?? colorFor(trip.id);
  return (
    <Link
      href={`/trip/${trip.id}/places`}
      className="block rounded-2xl overflow-hidden shadow-sm active:scale-[0.99] transition-transform"
    >
      <div className="relative h-28" style={{ background: bg }} />
      <div className="card border-t-0 rounded-t-none p-4">
        <div className="text-xl font-semibold leading-tight">{trip.name}</div>
        {trip.destination && (
          <div className="text-sm text-[color:var(--muted)] mt-0.5">{trip.destination}</div>
        )}
        <div className="text-xs text-[color:var(--muted)] mt-2">
          {formatRange(trip.start_date, trip.end_date)}
        </div>
      </div>
    </Link>
  );
}
