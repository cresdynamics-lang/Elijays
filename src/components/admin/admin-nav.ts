import type { AdminModule } from "@/lib/auth/permissions";

export type NavItemConfig = {
  label: string;
  href: string;
  module: AdminModule;
  badgeKey?: keyof import("@/lib/admin/badges").NavBadges;
};

export type NavGroupConfig = {
  title: string;
  items: NavItemConfig[];
};

export const ADMIN_NAV_GROUPS: NavGroupConfig[] = [
  {
    title: "OVERVIEW",
    items: [{ label: "Dashboard", href: "/admin", module: "dashboard" }],
  },
  {
    title: "CATALOGUE",
    items: [
      { label: "Products", href: "/admin/products", module: "products" },
      {
        label: "Inventory",
        href: "/admin/inventory",
        module: "inventory",
        badgeKey: "lowStock",
      },
    ],
  },
  {
    title: "SALES",
    items: [
      { label: "Orders", href: "/admin/orders", module: "orders", badgeKey: "orders" },
      {
        label: "Bespoke and Fittings",
        href: "/admin/bespoke",
        module: "bespoke",
        badgeKey: "bespoke",
      },
      { label: "Customers", href: "/admin/customers", module: "customers" },
    ],
  },
  {
    title: "CONTENT",
    items: [
      { label: "Journal (Blog)", href: "/admin/journal", module: "journal" },
      { label: "Pages and Sections", href: "/admin/pages", module: "pages" },
    ],
  },
  {
    title: "GROWTH",
    items: [
      { label: "Marketing", href: "/admin/marketing", module: "marketing" },
      { label: "Reviews", href: "/admin/reviews", module: "reviews", badgeKey: "reviews" },
      { label: "Reports", href: "/admin/reports", module: "reports" },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { label: "Settings", href: "/admin/settings", module: "settings" },
      { label: "Users and Roles", href: "/admin/users", module: "users" },
      { label: "Audit Log", href: "/admin/audit", module: "audit" },
    ],
  },
];
