import { RoleKey } from "@prisma/client";

export type AdminModule =
  | "dashboard"
  | "products"
  | "categories"
  | "inventory"
  | "collections"
  | "orders"
  | "bespoke"
  | "customers"
  | "journal"
  | "pages"
  | "media"
  | "faqs"
  | "marketing"
  | "reviews"
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
  "bespoke",
  "customers",
  "journal",
  "pages",
  "media",
  "faqs",
  "marketing",
  "reviews",
  "reports",
  "settings",
  "users",
  "audit",
];

const ROLE_MODULES: Record<RoleKey, AdminModule[]> = {
  OWNER: ALL,
  MANAGER: ALL.filter((m) => !["settings", "users", "audit"].includes(m)),
  CATALOGUE: ["dashboard", "products", "categories", "collections", "media", "inventory"],
  EDITOR: ["dashboard", "journal", "pages", "faqs", "media"],
  SALES: ["dashboard", "orders", "customers", "bespoke"],
  STOCK: ["dashboard", "inventory"],
  TAILOR: ["dashboard", "bespoke", "customers"],
};

export function canAccess(role: RoleKey, module: AdminModule): boolean {
  return ROLE_MODULES[role]?.includes(module) ?? false;
}

export function modulesFor(role: RoleKey): AdminModule[] {
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
