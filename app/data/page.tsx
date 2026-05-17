"use client";

import Link from "next/link";
import { useState } from "react";
import { exportAll, importAll, type ExportBundle } from "@/lib/exportImport";

export default function DataPage() {
  const [busy, setBusy] = useState<"idle" | "exporting" | "importing">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onExport() {
    setBusy("exporting");
    setMessage(null);
    try {
      const bundle = await exportAll();
      const blob = new Blob([JSON.stringify(bundle, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      a.download = `travel-planner-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage("Exported. Save the file somewhere safe (iCloud Drive, email to yourself, etc).");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy("idle");
    }
  }

  async function onImport(file: File, mode: "merge" | "replace") {
    setBusy("importing");
    setMessage(null);
    try {
      const text = await file.text();
      const bundle = JSON.parse(text) as ExportBundle;
      await importAll(bundle, mode);
      setMessage(
        mode === "replace"
          ? "Imported (replaced all existing data)."
          : "Imported (merged with existing data — items with matching IDs were overwritten).",
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy("idle");
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>, mode: "merge" | "replace") {
    const f = e.target.files?.[0];
    e.target.value = ""; // allow re-picking same file
    if (!f) return;
    if (mode === "replace" && !confirm("Replace ALL existing trips and data with the file contents?")) {
      return;
    }
    onImport(f, mode);
  }

  return (
    <main className="flex-1 px-4 safe-pt pb-24">
      <header className="flex items-center gap-2 py-2">
        <Link href="/" className="px-2 py-2 text-lg">
          ←
        </Link>
        <h1 className="text-xl font-bold flex-1">Data</h1>
      </header>

      <p className="text-sm text-[color:var(--muted)] mb-5">
        All trip data lives on this device. Export to back it up or move it to another phone.
        Imports include images.
      </p>

      <section className="card p-4 mb-4">
        <h2 className="font-semibold mb-1">Export</h2>
        <p className="text-sm text-[color:var(--muted)] mb-3">
          Downloads a single JSON file containing every trip, list, and image on this device.
        </p>
        <button
          onClick={onExport}
          disabled={busy !== "idle"}
          className="btn btn-primary w-full"
        >
          {busy === "exporting" ? "Exporting…" : "Export all data"}
        </button>
      </section>

      <section className="card p-4 mb-4">
        <h2 className="font-semibold mb-1">Import (merge)</h2>
        <p className="text-sm text-[color:var(--muted)] mb-3">
          Adds items from the file. If an item with the same id already exists, it&apos;s overwritten.
          Other existing data is left alone.
        </p>
        <label className="btn btn-ghost border border-[color:var(--card-border)] w-full cursor-pointer">
          {busy === "importing" ? "Importing…" : "Choose file to merge"}
          <input
            type="file"
            accept="application/json"
            className="hidden"
            disabled={busy !== "idle"}
            onChange={(e) => onFile(e, "merge")}
          />
        </label>
      </section>

      <section className="card p-4 mb-4">
        <h2 className="font-semibold mb-1 text-[color:var(--danger)]">Import (replace)</h2>
        <p className="text-sm text-[color:var(--muted)] mb-3">
          Wipes all current data first, then loads the file. Useful when restoring on a new device.
        </p>
        <label className="btn btn-danger w-full cursor-pointer">
          {busy === "importing" ? "Importing…" : "Choose file to replace all"}
          <input
            type="file"
            accept="application/json"
            className="hidden"
            disabled={busy !== "idle"}
            onChange={(e) => onFile(e, "replace")}
          />
        </label>
      </section>

      {message && (
        <p className="text-sm mt-2 text-[color:var(--muted)]">{message}</p>
      )}
    </main>
  );
}
