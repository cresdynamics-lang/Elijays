"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/admin/login/actions";

const initial: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form action={action} className="space-y-4">
      {state.error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {state.error}
        </p>
      ) : null}
      <label className="block">
        <span className="text-xs uppercase tracking-widest text-ivory-faint">
          Email
        </span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="mt-1 w-full rounded-lg border border-line bg-noir px-3 py-2.5 text-sm text-ivory focus:border-gold/40 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-xs uppercase tracking-widest text-ivory-faint">
          Password
        </span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-lg border border-line bg-noir px-3 py-2.5 text-sm text-ivory focus:border-gold/40 focus:outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full border border-gold/50 bg-gold/15 py-2.5 text-xs font-medium uppercase tracking-widest text-gold transition hover:bg-gold/25 disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
