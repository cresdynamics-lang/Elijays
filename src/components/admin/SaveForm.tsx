"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useTransition,
} from "react";
import { cn } from "@/components/admin/cn";

type SaveState = {
  pending: boolean;
  saved: boolean;
  error: string;
  run: (action: (formData: FormData) => Promise<unknown>, formData: FormData) => void;
};

const SaveContext = createContext<SaveState | null>(null);

// Shares one save state between a form and buttons that sit elsewhere on the
// page (e.g. a sidebar button that submits the main form via `form="id"`).
export function SaveScope({ children }: { children: React.ReactNode }) {
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(t);
  }, [saved]);

  const run: SaveState["run"] = (action, formData) => {
    setSaved(false);
    setError("");
    start(async () => {
      try {
        await action(formData);
        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save");
      }
    });
  };

  return (
    <SaveContext.Provider value={{ pending, saved, error, run }}>
      {children}
    </SaveContext.Provider>
  );
}

function useSave() {
  const ctx = useContext(SaveContext);
  if (!ctx) throw new Error("SaveForm and SaveButton must sit inside <SaveScope>");
  return ctx;
}

export function SaveForm({
  action,
  children,
  ...props
}: Omit<React.FormHTMLAttributes<HTMLFormElement>, "action"> & {
  action: (formData: FormData) => Promise<unknown>;
}) {
  const { run } = useSave();
  return (
    <form {...props} action={(formData) => run(action, formData)}>
      {children}
    </form>
  );
}

export function SaveButton({
  children,
  pendingLabel = "Saving…",
  savedLabel = "Saved ✓",
  className,
  form,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  savedLabel?: string;
  className?: string;
  form?: string;
}) {
  const { pending, saved } = useSave();
  return (
    <button
      type="submit"
      form={form}
      disabled={pending}
      aria-busy={pending}
      className={cn(
        "transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-60",
        className,
        saved && "border-emerald-400/50! bg-emerald-400/10! text-emerald-300!",
      )}
    >
      {pending ? pendingLabel : saved ? savedLabel : children}
    </button>
  );
}

export function SaveError({ className }: { className?: string }) {
  const { error } = useSave();
  if (!error) return null;
  return (
    <p role="alert" className={cn("text-xs text-red-300", className)}>
      {error}
    </p>
  );
}
