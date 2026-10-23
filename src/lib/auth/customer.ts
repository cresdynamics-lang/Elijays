import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { Customer } from "@prisma/client";

const COOKIE = "elijays_customer_session";
const DAYS = 30;

export type CustomerAccount = Pick<
  Customer,
  "id" | "email" | "firstName" | "lastName" | "phone"
>;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function issueSession(customerId: string) {
  const raw = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + DAYS * 24 * 60 * 60 * 1000);
  await prisma.customerSession.create({
    data: { customerId, token: hashToken(raw), expiresAt },
  });
  await prisma.customer.update({
    where: { id: customerId },
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
}

function toAccount(customer: Customer): CustomerAccount {
  return {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
  };
}

export async function registerCustomer(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
}) {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = normalizeEmail(input.email);
  const phone = input.phone?.trim() || null;
  const password = input.password;

  if (!firstName || !lastName) {
    return { ok: false as const, error: "First and last name are required" };
  }
  if (!email || !email.includes("@")) {
    return { ok: false as const, error: "A valid email is required" };
  }
  if (password.length < 8) {
    return { ok: false as const, error: "Password must be at least 8 characters" };
  }

  const existing = await prisma.customer.findFirst({
    where: { email, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  const passwordHash = await bcrypt.hash(password, 10);

  if (existing?.passwordHash) {
    return {
      ok: false as const,
      error: "An account already exists for this email. Sign in instead.",
    };
  }

  const customer = existing
    ? await prisma.customer.update({
        where: { id: existing.id },
        data: {
          firstName,
          lastName,
          phone: phone ?? existing.phone,
          passwordHash,
        },
      })
    : await prisma.customer.create({
        data: { firstName, lastName, email, phone, passwordHash },
      });

  await issueSession(customer.id);
  return { ok: true as const, customer: toAccount(customer) };
}

export async function loginCustomer(email: string, password: string) {
  const normalized = normalizeEmail(email);
  const customer = await prisma.customer.findFirst({
    where: { email: normalized, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
  if (!customer?.passwordHash) {
    return { ok: false as const, error: "Invalid email or password" };
  }
  const valid = await bcrypt.compare(password, customer.passwordHash);
  if (!valid) {
    return { ok: false as const, error: "Invalid email or password" };
  }
  await issueSession(customer.id);
  return { ok: true as const, customer: toAccount(customer) };
}

export async function logoutCustomer() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (raw) {
    await prisma.customerSession.updateMany({
      where: { token: hashToken(raw), deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
  jar.delete(COOKIE);
}

export async function getCustomerSession(): Promise<CustomerAccount | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const session = await prisma.customerSession.findFirst({
    where: {
      token: hashToken(raw),
      deletedAt: null,
      expiresAt: { gt: new Date() },
      customer: { deletedAt: null },
    },
    include: { customer: true },
  });
  if (!session) return null;
  return toAccount(session.customer);
}
