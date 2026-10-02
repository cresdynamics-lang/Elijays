"use client";

import { useEffect, useState } from "react";
import { navigationConfig } from "@/lib/navigation";

export function AnnouncementBar({ hidden }: { hidden: boolean }) {
  const messages = navigationConfig.announcements;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 4500);
    return () => clearInterval(id);
  }, [messages.length]);

  return (
    <div
      className={`overflow-hidden border-b border-[var(--line)] bg-noir-soft transition-[height,opacity] duration-300 ease-out ${
        hidden ? "h-0 opacity-0 pointer-events-none" : "h-9 opacity-100"
      }`}
      aria-live="polite"
    >
      <div className="flex h-9 items-center justify-center px-4">
        <p
          key={messages[index]?.id}
          className="animate-fade-in text-[0.625rem] font-normal uppercase tracking-[0.2em] text-gold/90"
        >
          {messages[index]?.text}
        </p>
      </div>
    </div>
  );
}
