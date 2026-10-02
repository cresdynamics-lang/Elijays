import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { saveShopSettings } from "./actions";

type ShopValue = { address?: string; hours?: string; whatsapp?: string };

export default async function SettingsPage() {
  const shop = await prisma.setting.findUnique({ where: { key: "shop" } });
  const payments = await prisma.setting.findUnique({ where: { key: "payments" } });
  const delivery = await prisma.setting.findUnique({ where: { key: "delivery" } });
  const value = (shop?.value ?? {}) as ShopValue;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Shop · delivery · payments · integrations" />
      <div className="grid gap-8 lg:grid-cols-2">
        <form
          action={saveShopSettings}
          className="space-y-4 rounded-xl border border-line bg-noir-soft/40 p-6"
        >
          <h2 className="text-xs uppercase tracking-widest text-ivory-faint">
            Shop details
          </h2>
          <label className="block text-sm">
            <span className="text-[11px] uppercase tracking-widest text-ivory-faint">
              Address
            </span>
            <textarea
              name="address"
              rows={3}
              defaultValue={value.address ?? ""}
              className="mt-1 w-full rounded-lg border border-line bg-noir px-3 py-2 text-ivory"
            />
          </label>
          <label className="block text-sm">
            <span className="text-[11px] uppercase tracking-widest text-ivory-faint">
              Hours
            </span>
            <input
              name="hours"
              defaultValue={value.hours ?? ""}
              className="mt-1 w-full rounded-lg border border-line bg-noir px-3 py-2 text-ivory"
            />
          </label>
          <label className="block text-sm">
            <span className="text-[11px] uppercase tracking-widest text-ivory-faint">
              WhatsApp number
            </span>
            <input
              name="whatsapp"
              defaultValue={value.whatsapp ?? ""}
              className="mt-1 w-full rounded-lg border border-line bg-noir px-3 py-2 text-ivory"
            />
          </label>
          <button
            type="submit"
            className="rounded-full border border-gold/40 bg-gold/10 px-5 py-2 text-xs uppercase tracking-widest text-gold"
          >
            Save
          </button>
        </form>

        <div className="space-y-4">
          <section className="rounded-xl border border-line bg-noir-soft/40 p-6">
            <h2 className="mb-3 text-xs uppercase tracking-widest text-ivory-faint">
              Payments
            </h2>
            <pre className="font-mono text-xs text-ivory-muted">
              {JSON.stringify(payments?.value ?? {}, null, 2)}
            </pre>
          </section>
          <section className="rounded-xl border border-line bg-noir-soft/40 p-6">
            <h2 className="mb-3 text-xs uppercase tracking-widest text-ivory-faint">
              Delivery
            </h2>
            <pre className="font-mono text-xs text-ivory-muted">
              {JSON.stringify(delivery?.value ?? {}, null, 2)}
            </pre>
          </section>
          <section className="rounded-xl border border-line bg-noir-soft/40 p-6">
            <h2 className="mb-3 text-xs uppercase tracking-widest text-ivory-faint">
              Users and roles
            </h2>
            <p className="text-sm text-ivory-muted">
              Owner · Manager · Catalogue · Editor · Sales · Stock · Tailor — managed under
              Users and Roles. Sign-in uses email and password.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
