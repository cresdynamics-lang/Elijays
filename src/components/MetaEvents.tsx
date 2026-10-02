"use client";

import { useEffect } from "react";
import { trackMeta } from "@/lib/analytics";

/** Fire Meta PageView once per mount (consent-gated). */
export function MetaPageView() {
  useEffect(() => {
    trackMeta({ name: "PageView" });
  }, []);
  return null;
}

export function MetaBrowse({ category }: { category: string }) {
  useEffect(() => {
    trackMeta({ name: "Browse", content_category: category });
  }, [category]);
  return null;
}

export function MetaViewContent({
  id,
  value,
}: {
  id: string;
  value?: number;
}) {
  useEffect(() => {
    trackMeta({
      name: "ViewContent",
      content_ids: [id],
      content_type: "product",
      value,
      currency: "KES",
    });
  }, [id, value]);
  return null;
}
