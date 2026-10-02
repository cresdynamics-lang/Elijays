"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { canAccess } from "@/lib/auth/permissions";
import { writeAudit } from "@/lib/admin/audit";

export async function saveShopSettings(formData: FormData) {
  const user = await getSessionUser();
  if (!user || !canAccess(user.role, "settings")) throw new Error("Forbidden");

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
