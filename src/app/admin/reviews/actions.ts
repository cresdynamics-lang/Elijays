"use server";

import { revalidatePath } from "next/cache";
import { ReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { writeAudit } from "@/lib/admin/audit";

export async function setReviewStatus(id: string, status: "APPROVED" | "HIDDEN") {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Forbidden");
  }
  const before = await prisma.review.findFirst({ where: { id, deletedAt: null } });
  if (!before) return;
  await prisma.review.update({
    where: { id },
    data: { status: status as ReviewStatus },
  });
  await writeAudit({
    actorId: user.id,
    action: status === "APPROVED" ? "Approved review" : "Hid review",
    entityType: "review",
    entityId: id,
    entityLabel: before.authorName,
    before: { status: before.status },
    after: { status },
  });
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
}
