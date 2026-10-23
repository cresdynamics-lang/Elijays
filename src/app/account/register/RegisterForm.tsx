"use client";

import { useActionState } from "react";
import {
  registerCustomerAction,
  type RegisterState,
} from "@/app/account/register/actions";

const initial: RegisterState = {};

export function RegisterForm() {
  const [state, action, pending] = useActionState(
    registerCustomerAction,
    initial,
  );

  return (
    <form action={action} className="mt-10 space-y-6">
      {state.error ? (
        <p className="border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="block">
          <span className="text-[0.65rem] uppercase tracking-[0.18em] text-ivory/50">
            First name
          </span>
          <input
            name="firstName"
            autoComplete="given-name"
            required
            className="input-field mt-1"
          />
        </label>
        <label className="block">
          <span className="text-[0.65rem] uppercase tracking-[0.18em] text-ivory/50">
            Last name
          </span>
          <input
            name="lastName"
            autoComplete="family-name"
            required
            className="input-field mt-1"
          />
        </label>
      </div>
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
          Phone
        </span>
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
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
          autoComplete="new-password"
          minLength={8}
          required
          className="input-field mt-1"
        />
      </label>
      <label className="block">
        <span className="text-[0.65rem] uppercase tracking-[0.18em] text-ivory/50">
          Confirm password
        </span>
        <input
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="input-field mt-1"
        />
      </label>
      <button type="submit" disabled={pending} className="btn-gold w-full">
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
