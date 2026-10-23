"use server";

import { registerCustomer } from "@/lib/auth/customer";
import { redirect } from "next/navigation";

export type RegisterState = { error?: string };

export async function registerCustomerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!firstName || !lastName || !email || !password) {
    return { error: "Name, email and password are required" };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match" };
  }

  const result = await registerCustomer({
    firstName,
    lastName,
    email,
    phone,
    password,
  });
  if (!result.ok) {
    return { error: result.error };
  }
  redirect("/account");
}
