"use server";

import { login } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Email and password are required" };
  }
  const result = await login(email, password);
  if (!result.ok) {
    return { error: result.error };
  }
  redirect("/admin");
}
