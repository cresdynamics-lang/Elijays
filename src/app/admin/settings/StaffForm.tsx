"use client";

import { useActionState } from "react";
import {
  createStaffAccount,
  type StaffFormState,
} from "@/app/admin/settings/actions";
import { STAFF_PERMISSION_OPTIONS } from "@/lib/auth/permissions";

const initial: StaffFormState = {};

export function StaffForm() {
  const [state, action, pending] = useActionState(createStaffAccount, initial);

  return (
    <form action={action} className="space-y-4">
      {state.error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-gold">
          Staff account created. They can sign in at /admin/login.
        </p>
      ) : null}
      <label className="block text-sm">
        <span className="text-[11px] uppercase tracking-widest text-ivory-faint">
          Name
        </span>
        <input
          name="name"
          required
          className="mt-1 w-full rounded-lg border border-line bg-noir px-3 py-2 text-ivory"
        />
      </label>
      <label className="block text-sm">
        <span className="text-[11px] uppercase tracking-widest text-ivory-faint">
          Email
        </span>
        <input
          name="email"
          type="email"
          required
          autoComplete="off"
          className="mt-1 w-full rounded-lg border border-line bg-noir px-3 py-2 text-ivory"
        />
      </label>
      <label className="block text-sm">
        <span className="text-[11px] uppercase tracking-widest text-ivory-faint">
          Password
        </span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-line bg-noir px-3 py-2 text-ivory"
        />
      </label>
      <fieldset>
        <legend className="text-[11px] uppercase tracking-widest text-ivory-faint">
          Permissions
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {STAFF_PERMISSION_OPTIONS.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-2 text-sm text-ivory-muted"
            >
              <input
                type="checkbox"
                name="modules"
                value={option.id}
                className="accent-gold"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-gold/40 bg-gold/10 px-5 py-2 text-xs uppercase tracking-widest text-gold disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create staff account"}
      </button>
    </form>
  );
}
