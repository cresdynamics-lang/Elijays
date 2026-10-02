"use client";

import { logoutAction } from "@/app/admin/logout/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="text-xs text-ivory-faint transition hover:text-gold"
      >
        Sign out
      </button>
    </form>
  );
}
