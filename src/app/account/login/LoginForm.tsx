"use client";

import { useActionState } from "react";
import {
  loginCustomerAction,
  type LoginState,
} from "@/app/account/login/actions";

const initial: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginCustomerAction, initial);

  return (
    <form action={action} className="mt-10 space-y-6">
      {state.error ? (
        <p className="border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {state.error}
        </p>
      ) : null}
      <label className="block">
        <span className="text-[0.65rem] uppercase tracking-[0.18em] text-ivory/50">
          Email
        </span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="input-field mt-1"
        />
      </label>
      <label className="block">
        <span className="text-[0.65rem] uppercase tracking-[0.18em] text-ivory/50">
          Password
        </span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input-field mt-1"
        />
      </label>
      <button type="submit" disabled={pending} className="btn-gold w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
