import { RoleKey } from "@prisma/client";

export type AdminModule =
  | "dashboard"
  | "products"
  | "categories"
  | "inventory"
  | "collections"
  | "orders"
  | "customers"
  | "journal"
  | "media"
  | "faqs"
  | "reports"
  | "settings"
  | "users"
  | "audit";

const ALL: AdminModule[] = [
  "dashboard",
  "products",
  "categories",
  "inventory",
  "collections",
  "orders",
  "customers",
  "journal",
  "media",
  "faqs",
  "reports",
  "settings",
  "users",
  "audit",
];

const ROLE_MODULES: Record<RoleKey, AdminModule[]> = {
  OWNER: ALL,
  MANAGER: ALL.filter((m) => !["settings", "users", "audit"].includes(m)),
  CATALOGUE: ["dashboard", "products", "categories", "collections", "media", "inventory"],
  EDITOR: ["dashboard", "journal", "faqs", "media"],
  SALES: ["dashboard", "orders", "customers"],
  STOCK: ["dashboard", "inventory"],
  TAILOR: ["dashboard", "customers"],
};

export const STAFF_PERMISSION_OPTIONS: { id: AdminModule; label: string }[] = [
  { id: "products", label: "Products" },
  { id: "inventory", label: "Stock" },
  { id: "orders", label: "Orders" },
  { id: "customers", label: "Customers" },
  { id: "journal", label: "Blog" },
  { id: "media", label: "Media" },
  { id: "faqs", label: "FAQs" },
  { id: "reports", label: "Reports" },
];

export function canAccess(
  role: RoleKey,
  module: AdminModule,
  allowedModules: string[] = [],
): boolean {
  if (role === RoleKey.OWNER) return true;
  if (allowedModules.length > 0) {
    if (module === "dashboard") return true;
    return allowedModules.includes(module);
  }
  return ROLE_MODULES[role]?.includes(module) ?? false;
}

export function userCan(
  user: { role: RoleKey; allowedModules?: string[] } | null | undefined,
  module: AdminModule,
): boolean {
  if (!user) return false;
  return canAccess(user.role, module, user.allowedModules ?? []);
}

export function modulesFor(role: RoleKey, allowedModules: string[] = []): AdminModule[] {
  if (role === RoleKey.OWNER) return ALL;
  if (allowedModules.length > 0) {
    const extra = allowedModules.filter((m): m is AdminModule =>
      ALL.includes(m as AdminModule),
    );
    return Array.from(new Set<AdminModule>(["dashboard", ...extra]));
  }
  return ROLE_MODULES[role] ?? [];
}

export const ROLE_LABELS: Record<RoleKey, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  CATALOGUE: "Catalogue editor",
  EDITOR: "Editor",
  SALES: "Sales",
  STOCK: "Stock clerk",
  TAILOR: "Tailor",
};

export function accessLabel(user: {
  role: RoleKey;
  allowedModules?: string[];
}): string {
  if (user.role === RoleKey.OWNER) return ROLE_LABELS.OWNER;
  if (user.allowedModules && user.allowedModules.length > 0) return "Staff";
  return ROLE_LABELS[user.role];
}
