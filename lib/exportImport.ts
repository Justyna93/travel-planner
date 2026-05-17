"use client";

import { db } from "./db";
import type {
  BuyItem,
  InfoImage,
  InfoItem,
  PackItem,
  PackList,
  PackTemplate,
  PackTemplateItem,
  PlanItem,
  Place,
  Trip,
} from "./types";

// Wire format for image blobs — JSON-safe. base64 keeps things simple over
// data: URLs (no need to parse the prefix) and round-trips on every browser.
interface ImageWire {
  id: string;
  name: string;
  type: string;
  created_at: string;
  data_base64: string;
}

export interface ExportBundle {
  format: "travel-planner-export";
  version: 1;
  exported_at: string;
  trips: Trip[];
  places: Place[];
  info_items: InfoItem[];
  info_images: ImageWire[];
  plan_items: PlanItem[];
  buy_items: BuyItem[];
  pack_templates: PackTemplate[];
  pack_template_items: PackTemplateItem[];
  pack_lists: PackList[];
  pack_items: PackItem[];
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  return btoa(binary);
}

function base64ToBlob(b64: string, type: string): Blob {
  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return new Blob([buf], { type: type || "application/octet-stream" });
}

export async function exportAll(): Promise<ExportBundle> {
  const [
    trips,
    places,
    info_items,
    info_images_raw,
    plan_items,
    buy_items,
    pack_templates,
    pack_template_items,
    pack_lists,
    pack_items,
  ] = await Promise.all([
    db.trips.toArray(),
    db.places.toArray(),
    db.info_items.toArray(),
    db.info_images.toArray(),
    db.plan_items.toArray(),
    db.buy_items.toArray(),
    db.pack_templates.toArray(),
    db.pack_template_items.toArray(),
    db.pack_lists.toArray(),
    db.pack_items.toArray(),
  ]);

  const info_images: ImageWire[] = await Promise.all(
    info_images_raw.map(async (img: InfoImage) => ({
      id: img.id,
      name: img.name,
      type: img.type,
      created_at: img.created_at,
      data_base64: await blobToBase64(img.blob),
    })),
  );

  return {
    format: "travel-planner-export",
    version: 1,
    exported_at: new Date().toISOString(),
    trips,
    places,
    info_items,
    info_images,
    plan_items,
    buy_items,
    pack_templates,
    pack_template_items,
    pack_lists,
    pack_items,
  };
}

export async function importAll(
  bundle: ExportBundle,
  mode: "merge" | "replace",
): Promise<void> {
  if (bundle.format !== "travel-planner-export" || bundle.version !== 1) {
    throw new Error("This file isn't a travel-planner export (v1).");
  }

  const images: InfoImage[] = bundle.info_images.map((w) => ({
    id: w.id,
    name: w.name,
    type: w.type,
    created_at: w.created_at,
    blob: base64ToBlob(w.data_base64, w.type),
  }));

  await db.transaction(
    "rw",
    [
      db.trips,
      db.places,
      db.info_items,
      db.info_images,
      db.plan_items,
      db.buy_items,
      db.pack_templates,
      db.pack_template_items,
      db.pack_lists,
      db.pack_items,
    ],
    async () => {
      if (mode === "replace") {
        await Promise.all([
          db.trips.clear(),
          db.places.clear(),
          db.info_items.clear(),
          db.info_images.clear(),
          db.plan_items.clear(),
          db.buy_items.clear(),
          db.pack_templates.clear(),
          db.pack_template_items.clear(),
          db.pack_lists.clear(),
          db.pack_items.clear(),
        ]);
      }
      // bulkPut upserts by primary key — works for both merge and replace.
      await Promise.all([
        db.trips.bulkPut(bundle.trips),
        db.places.bulkPut(bundle.places),
        db.info_items.bulkPut(bundle.info_items),
        db.info_images.bulkPut(images),
        db.plan_items.bulkPut(bundle.plan_items),
        db.buy_items.bulkPut(bundle.buy_items),
        db.pack_templates.bulkPut(bundle.pack_templates),
        db.pack_template_items.bulkPut(bundle.pack_template_items),
        db.pack_lists.bulkPut(bundle.pack_lists),
        db.pack_items.bulkPut(bundle.pack_items),
      ]);
    },
  );
}
