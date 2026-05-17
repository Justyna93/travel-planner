export type PlaceCategory = "see" | "eat";
export type BuyListType = "before" | "there";

type Doc = { id: string; created_at: string };

export interface Trip extends Doc {
  name: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  cover_color: string | null;
}

export interface Place extends Doc {
  trip_id: string;
  name: string;
  category: PlaceCategory;
  priority: number;
  notes: string;
  sort_order: number;
}

export interface InfoItem extends Doc {
  trip_id: string;
  title: string;
  description: string;
  image_id: string | null;
  sort_order: number;
}

export interface PlanItem extends Doc {
  trip_id: string;
  place_id: string | null;
  day_date: string;
  custom_title: string | null;
  sort_order: number;
}

export interface BuyItem extends Doc {
  trip_id: string;
  list_type: BuyListType;
  text: string;
  checked: boolean;
  sort_order: number;
}

export interface PackTemplate extends Doc {
  name: string;
}

export interface PackTemplateItem {
  id: string;
  template_id: string;
  text: string;
  sort_order: number;
}

export interface PackList extends Doc {
  trip_id: string;
  name: string;
  template_id: string | null;
  sort_order: number;
}

export interface PackItem {
  id: string;
  list_id: string;
  text: string;
  checked: boolean;
  sort_order: number;
}

// Internal: blob storage row for info-tab images.
export interface InfoImage {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  created_at: string;
}
