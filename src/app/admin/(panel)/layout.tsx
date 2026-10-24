import { getSessionUser } from "@/lib/auth/session";
import { getNavBadges } from "@/lib/admin/badges";
import { AdminShell } from "@/components/admin/AdminShell";
import { redirect } from "next/navigation";

// Signed-in admin pages. The login page lives outside this route group so this
// layout never has to guess which page it is rendering.
export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/admin/login");
  }

  const badges = await getNavBadges();

  return (
    <AdminShell user={user} badges={badges}>
      {children}
    </AdminShell>
  );
}
