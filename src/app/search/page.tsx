"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import { SearchOverlay } from "@/components/nav/SearchOverlay";
import { useRouter } from "next/navigation";

export default function SearchPage() {
  const router = useRouter();
  useEffect(() => {
    track({ name: "search_open" });
  }, []);

  return (
    <SearchOverlay
      onClose={() => {
        router.back();
      }}
    />
  );
}
