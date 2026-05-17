"use client";

import Dexie, { type EntityTable } from "dexie";
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

// Single Dexie database for the whole app. All data lives in IndexedDB on this device.
export class TravelDB extends Dexie {
  trips!: EntityTable<Trip, "id">;
  places!: EntityTable<Place, "id">;
  info_items!: EntityTable<InfoItem, "id">;
  info_images!: EntityTable<InfoImage, "id">;
  plan_items!: EntityTable<PlanItem, "id">;
  buy_items!: EntityTable<BuyItem, "id">;
  pack_templates!: EntityTable<PackTemplate, "id">;
  pack_template_items!: EntityTable<PackTemplateItem, "id">;
  pack_lists!: EntityTable<PackList, "id">;
  pack_items!: EntityTable<PackItem, "id">;

  constructor() {
    super("travel-planner");
    this.version(1).stores({
      // Indexes: primary key + commonly-queried fields.
      trips: "id, created_at",
      places: "id, trip_id, sort_order",
      info_items: "id, trip_id, sort_order",
      info_images: "id, created_at",
      plan_items: "id, trip_id, day_date, sort_order",
      buy_items: "id, trip_id, list_type, sort_order",
      pack_templates: "id, created_at",
      pack_template_items: "id, template_id, sort_order",
      pack_lists: "id, trip_id, sort_order",
      pack_items: "id, list_id, sort_order",
    });
  }
}

// Lazy singleton — only instantiated in the browser. Avoids "indexedDB is not defined"
// during any accidental server import.
let _db: TravelDB | null = null;

export function getDb(): TravelDB {
  if (typeof window === "undefined") {
    throw new Error("Dexie database is only available in the browser");
  }
  if (!_db) _db = new TravelDB();
  return _db;
}

// Convenience export so call sites can write `db.trips.toArray()` style.
// This is a Proxy so it stays lazy and SSR-safe.
export const db = new Proxy({} as TravelDB, {
  get(_target, prop) {
    return getDb()[prop as keyof TravelDB];
  },
}) as TravelDB;

// 15-char lowercase alphanum id, same format we used for PocketBase.
export function newId(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const arr = new Uint8Array(15);
  (typeof crypto !== "undefined" ? crypto : globalThis.crypto).getRandomValues(arr);
  let s = "";
  for (const b of arr) s += alphabet[b % alphabet.length];
  return s;
}

export function nowIso(): string {
  return new Date().toISOString();
}
