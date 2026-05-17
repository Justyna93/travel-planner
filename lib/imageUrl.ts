"use client";

import { useEffect, useState } from "react";
import { db } from "./db";

// Hook: takes an image_id stored in info_items.image_id, returns a Blob URL or null.
// The URL is revoked on unmount or when the id changes.
export function useImageUrl(imageId: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let createdUrl: string | null = null;

    if (!imageId) {
      setUrl(null);
      return;
    }

    db.info_images
      .get(imageId)
      .then((rec) => {
        if (cancelled || !rec) return;
        createdUrl = URL.createObjectURL(rec.blob);
        setUrl(createdUrl);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [imageId]);

  return url;
}
