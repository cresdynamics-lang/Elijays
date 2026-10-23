"use server";

import { logoutCustomer } from "@/lib/auth/customer";
import { redirect } from "next/navigation";

export async function logoutCustomerAction() {
  await logoutCustomer();
  redirect("/account/login");
}
