"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TripIndex() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  useEffect(() => {
    router.replace(`/trip/${id}/places`);
  }, [id, router]);
  return null;
}
