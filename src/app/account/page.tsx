import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/auth/customer";
import { logoutCustomerAction } from "@/app/account/actions";
import { prisma } from "@/lib/db";
import { formatKes } from "@/lib/constants";
import { navigationConfig } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Account",
  description: "Your ELIJAYS account.",
};

export default async function AccountPage() {
  const customer = await getCustomerSession();
  if (!customer) redirect("/account/login");

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { items: true },
  });

  return (
    <div className="atmosphere min-h-screen px-5 pb-28 pt-16 md:px-8">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow">{navigationConfig.secondary.account.label}</p>
        <h1 className="display mt-4 text-5xl">
          {customer.firstName} {customer.lastName}
        </h1>
        <p className="mt-4 text-sm text-ivory/55">{customer.email}</p>
        {customer.phone ? (
          <p className="mt-1 text-sm text-ivory/55">{customer.phone}</p>
        ) : null}

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/wishlist" className="btn-ghost">
            {navigationConfig.secondary.wishlist.label}
          </Link>
          <Link href="/bag" className="btn-ghost">
            Cart
          </Link>
          <form action={logoutCustomerAction}>
            <button type="submit" className="btn-ghost">
              Sign out
            </button>
          </form>
        </div>

        <section className="mt-16">
          <h2 className="display text-3xl">Orders</h2>
          {orders.length === 0 ? (
            <p className="whisper mt-5 text-xl">No orders yet.</p>
          ) : (
            <ul className="mt-8 space-y-6">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="border-b border-[var(--line)] pb-6"
                >
                  <p className="text-[0.65rem] uppercase tracking-[0.18em] text-gold">
                    Order #{order.number} · {order.status.toLowerCase()}
                  </p>
                  <p className="mt-2 text-sm text-ivory/70">
                    {order.items
                      .map((item) => `${item.name} × ${item.qty}`)
                      .join(" · ")}
                  </p>
                  <p className="mt-2 text-sm text-ivory/50">
                    {formatKes(order.totalKes)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
