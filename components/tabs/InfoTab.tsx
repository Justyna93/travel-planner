"use client";

import { useState } from "react";
import { SortableList } from "@/components/SortableList";
import { AddSheet } from "@/components/AddSheet";
import type { InfoItem } from "@/lib/types";
import { useImageUrl } from "@/lib/imageUrl";
import {
  createInfoItem,
  updateInfoItem,
  deleteInfoItem,
  reorderInfoItems,
  uploadInfoImage,
} from "@/lib/actions/info";

export function InfoTab({
  tripId,
  initial,
  readOnly = false,
}: {
  tripId: string;
  initial: InfoItem[];
  readOnly?: boolean;
}) {
  const [items, setItems] = useState<InfoItem[]>(initial);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<InfoItem | null>(null);

  async function save(
    payload: { title: string; description: string; image_id: string | null },
    existing?: InfoItem,
  ) {
    try {
      if (existing) {
        const updated = await updateInfoItem(existing.id, payload);
        setItems((s) => s.map((i) => (i.id === updated.id ? updated : i)));
      } else {
        const created = await createInfoItem({
          trip_id: tripId,
          ...payload,
          sort_order: items.length,
        });
        setItems((s) => [...s, created]);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function del(id: string) {
    if (!confirm("Delete this info item?")) return;
    setItems((s) => s.filter((i) => i.id !== id));
    await deleteInfoItem(id);
  }

  async function reorder(next: InfoItem[]) {
    setItems(next.map((p, idx) => ({ ...p, sort_order: idx })));
    const updates = next
      .map((p, idx) => ({ id: p.id, sort_order: idx, prev: p.sort_order }))
      .filter((u) => u.prev !== u.sort_order)
      .map(({ id, sort_order }) => ({ id, sort_order }));
    if (updates.length > 0) await reorderInfoItems(updates);
  }

  async function upload(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    try {
      return await uploadInfoImage(fd);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
      return null;
    }
  }

  return (
    <div className="px-4 pt-3">
      {!readOnly && (
        <div className="flex justify-end mb-3">
          <button onClick={() => setAdding(true)} className="btn btn-primary !min-h-0 !py-1.5 !px-3 text-sm">
            + Add info
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="card p-6 text-center text-sm text-[color:var(--muted)]">
          No info yet — add notes about transport, currency, restrictions…
        </div>
      ) : (
        <SortableList
          items={items.sort((a, b) => a.sort_order - b.sort_order)}
          onReorder={reorder}
          disabled={readOnly}
          renderItem={(item, handle) => (
            <div className="card p-4">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="font-semibold">{item.title}</div>
                  {item.description && (
                    <p className="text-sm mt-1 whitespace-pre-wrap">{item.description}</p>
                  )}
                </div>
                {!readOnly && (
                  <>
                    <button onClick={() => setEditing(item)} className="px-2 py-1 text-sm text-[color:var(--muted)]">
                      Edit
                    </button>
                    {handle}
                  </>
                )}
              </div>
              {item.image_id && (
                <InfoImage
                  imageId={item.image_id}
                  className="mt-3 rounded-lg w-full object-cover max-h-72"
                />
              )}
            </div>
          )}
        />
      )}

      {!readOnly && (
        <>
          <AddSheet open={adding} onClose={() => setAdding(false)} title="New info entry">
            <InfoForm
              uploadImage={upload}
              onSubmit={async (payload) => {
                await save(payload);
                setAdding(false);
              }}
            />
          </AddSheet>
          <AddSheet open={!!editing} onClose={() => setEditing(null)} title="Edit info">
            {editing && (
              <InfoForm
                initial={editing}
                uploadImage={upload}
                onSubmit={async (payload) => {
                  await save(payload, editing);
                  setEditing(null);
                }}
                onDelete={async () => {
                  await del(editing.id);
                  setEditing(null);
                }}
              />
            )}
          </AddSheet>
        </>
      )}
    </div>
  );
}

function InfoForm({
  initial,
  uploadImage,
  onSubmit,
  onDelete,
}: {
  initial?: InfoItem;
  uploadImage: (file: File) => Promise<string | null>;
  onSubmit: (payload: { title: string; description: string; image_id: string | null }) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageId, setImageId] = useState<string | null>(initial?.image_id ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    const id = await uploadImage(f);
    setUploading(false);
    if (id) setImageId(id);
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setSaving(true);
        await onSubmit({ title: title.trim(), description, image_id: imageId });
        setSaving(false);
      }}
      className="space-y-3"
    >
      <input
        className="input"
        placeholder="Title (e.g. Public transport)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        required
      />
      <textarea
        className="input"
        placeholder="Notes…"
        rows={5}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div>
        <label className="text-sm text-[color:var(--muted)]">Image (optional)</label>
        <input type="file" accept="image/*" onChange={onFile} className="block mt-1" />
        {uploading && <div className="text-xs text-[color:var(--muted)] mt-1">Uploading…</div>}
        {imageId && (
          <InfoImage imageId={imageId} className="mt-2 rounded-lg max-h-40 object-cover" />
        )}
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn btn-primary flex-1">
          {saving ? "Saving…" : "Save"}
        </button>
        {onDelete && (
          <button type="button" onClick={onDelete} className="btn btn-danger">
            Delete
          </button>
        )}
      </div>
    </form>
  );
}

function InfoImage({ imageId, className }: { imageId: string; className?: string }) {
  const url = useImageUrl(imageId);
  if (!url) return null;
  /* eslint-disable-next-line @next/next/no-img-element */
  return <img src={url} alt="" className={className} />;
}
