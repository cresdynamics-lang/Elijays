"use server";

import { loginCustomer } from "@/lib/auth/customer";
import { redirect } from "next/navigation";

export type LoginState = { error?: string };

export async function loginCustomerAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Email and password are required" };
  }
  const result = await loginCustomer(email, password);
  if (!result.ok) {
    return { error: result.error };
  }
  redirect("/account");
}
