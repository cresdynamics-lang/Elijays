import { getSessionUser } from "@/lib/auth/session";
import { getNavBadges } from "@/lib/admin/badges";
import { AdminShell } from "@/components/admin/AdminShell";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export const metadata = {
  title: { default: "Admin", template: "%s · ELIJAYS Admin" },
};

async function isLoginPath() {
  const h = await headers();
  return h.get("x-admin-login") === "1";
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const loginPage = await isLoginPath();
  const user = await getSessionUser();

  if (loginPage) {
    if (user) redirect("/admin");
    return (
      <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-ivory">
        {children}
      </div>
    );
  }

  if (!user) {
    redirect("/admin/login");
  }

  const badges = await getNavBadges();

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-ivory">
      <AdminShell user={user} badges={badges}>
        {children}
      </AdminShell>
    </div>
  );
}
