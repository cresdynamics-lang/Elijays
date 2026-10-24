"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { RoleKey } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import {
  STAFF_PERMISSION_OPTIONS,
  userCan,
  type AdminModule,
} from "@/lib/auth/permissions";
import { writeAudit } from "@/lib/admin/audit";

export async function saveShopSettings(formData: FormData) {
  const user = await getSessionUser();
  if (!user || !userCan(user, "settings")) throw new Error("Forbidden");

  const value = {
    address: String(formData.get("address") || ""),
    hours: String(formData.get("hours") || ""),
    whatsapp: String(formData.get("whatsapp") || ""),
  };

  const before = await prisma.setting.findUnique({ where: { key: "shop" } });
  await prisma.setting.upsert({
    where: { key: "shop" },
    create: { key: "shop", value },
    update: { value },
  });

  await writeAudit({
    actorId: user.id,
    action: "Updated shop settings",
    entityType: "settings",
    entityLabel: "shop",
    before: before?.value ?? null,
    after: value,
  });

  revalidatePath("/admin/settings");
}

export type StaffFormState = { error?: string; ok?: boolean };

const ALLOWED_STAFF_MODULES = new Set(
  STAFF_PERMISSION_OPTIONS.map((option) => option.id),
);

export async function createStaffAccount(
  _prev: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const actor = await getSessionUser();
  if (!actor || !userCan(actor, "settings")) {
    return { error: "You cannot create staff accounts." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const modules = formData
    .getAll("modules")
    .map((value) => String(value))
    .filter((value): value is AdminModule =>
      ALLOWED_STAFF_MODULES.has(value as AdminModule),
    );

  if (!name || !email || !password) {
    return { error: "Name, email and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (modules.length === 0) {
    return { error: "Choose at least one permission." };
  }

  const existing = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });
  if (existing) {
    return { error: "That email already has an admin account." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const staff = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: RoleKey.MANAGER,
      allowedModules: modules,
      active: true,
    },
  });

  await writeAudit({
    actorId: actor.id,
    action: "Created staff account",
    entityType: "user",
    entityId: staff.id,
    entityLabel: staff.email,
    after: { name, email, modules },
  });

  revalidatePath("/admin/settings");
  return { ok: true };
}
