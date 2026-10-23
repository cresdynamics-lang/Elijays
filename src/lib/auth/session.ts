import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { RoleKey, User } from "@prisma/client";

const COOKIE = "elijays_admin_session";
const DAYS = 14;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase(), deletedAt: null, active: true },
  });
  if (!user) return { ok: false as const, error: "Invalid email or password" };
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { ok: false as const, error: "Invalid email or password" };

  const raw = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { userId: user.id, token: hashToken(raw), expiresAt },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { lastSignInAt: new Date() },
  });

  const jar = await cookies();
  jar.set(COOKIE, raw, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return { ok: true as const, user };
}

export async function logout() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (raw) {
    await prisma.session.updateMany({
      where: { token: hashToken(raw), deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
  jar.delete(COOKIE);
}

export type SessionUser = Pick<
  User,
  "id" | "email" | "name" | "role" | "allowedModules"
>;

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const session = await prisma.session.findFirst({
    where: {
      token: hashToken(raw),
      deletedAt: null,
      expiresAt: { gt: new Date() },
      user: { active: true, deletedAt: null },
    },
    include: { user: true },
  });
  if (!session) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role as RoleKey,
    allowedModules: session.user.allowedModules ?? [],
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
