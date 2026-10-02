import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatKes } from "@/components/admin/formatKes";
import { archiveProduct, updateProduct } from "../actions";

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: {
      category: true,
      variants: {
        where: { deletedAt: null },
        include: {
          stockLevels: {
            where: { deletedAt: null },
            include: { location: true },
          },
        },
      },
    },
  });
  if (!product) notFound();

  const save = updateProduct.bind(null, product.id);
  const archive = archiveProduct.bind(null, product.id);

  return (
    <div>
      <PageHeader
        title={product.name}
        subtitle={product.sku}
        actionHref="/admin/products"
        actionLabel="Back to list"
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <form
            action={save}
            className="space-y-4 rounded-xl border border-line bg-noir-soft/40 p-6"
          >
            <h2 className="text-xs uppercase tracking-widest text-ivory-faint">
              Basic information
            </h2>
            <label className="block text-sm">
              <span className="text-[11px] uppercase tracking-widest text-ivory-faint">
                Product name
              </span>
              <input
                name="name"
                defaultValue={product.name}
                className="mt-1 w-full rounded-lg border border-line bg-noir px-3 py-2 text-ivory"
              />
            </label>
            <label className="block text-sm">
              <span className="text-[11px] uppercase tracking-widest text-ivory-faint">
                Short line
              </span>
              <input
                name="shortLine"
                defaultValue={product.shortLine ?? ""}
                className="mt-1 w-full rounded-lg border border-line bg-noir px-3 py-2 text-ivory"
              />
            </label>
            <label className="block text-sm">
              <span className="text-[11px] uppercase tracking-widest text-ivory-faint">
                Description
              </span>
              <textarea
                name="description"
                rows={4}
                defaultValue={product.description ?? ""}
                className="mt-1 w-full rounded-lg border border-line bg-noir px-3 py-2 text-sm text-ivory"
              />
            </label>
            <label className="block text-sm">
              <span className="text-[11px] uppercase tracking-widest text-ivory-faint">
                Price (KES)
              </span>
              <input
                name="priceKes"
                type="number"
                defaultValue={product.priceKes}
                className="mt-1 w-full rounded-lg border border-line bg-noir px-3 py-2 text-ivory"
              />
            </label>
            <p className="text-xs text-ivory-faint">
              Category: {product.category?.name ?? "—"} · SKU {product.sku}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="submit"
                className="rounded-full border border-gold/40 bg-gold/10 px-5 py-2 text-xs uppercase tracking-widest text-gold"
              >
                Save changes
              </button>
            </div>
          </form>

          <section className="rounded-xl border border-line bg-noir-soft/40 p-6">
            <h2 className="mb-4 text-xs uppercase tracking-widest text-ivory-faint">
              Variants and stock
            </h2>
            <ul className="divide-y divide-line/60">
              {product.variants.map((v) => {
                const shop =
                  v.stockLevels.find((l) => l.location.code === "SHOP")
                    ?.quantity ?? 0;
                const website =
                  v.stockLevels.find((l) => l.location.code === "WEB")
                    ?.quantity ?? 0;
                return (
                  <li
                    key={v.id}
                    className="grid grid-cols-4 gap-2 py-3 text-sm text-ivory"
                  >
                    <span>{v.colour ?? "—"}</span>
                    <span>{v.size ?? "—"}</span>
                    <span className="text-ivory-muted">Shop {shop}</span>
                    <span className="text-ivory-muted">Web {website}</span>
                  </li>
                );
              })}
            </ul>
            <Link
              href="/admin/inventory"
              className="mt-4 inline-block text-xs text-gold hover:underline"
            >
              Manage inventory →
            </Link>
          </section>
        </div>

        <aside className="space-y-6">
          <form
            action={save}
            className="rounded-xl border border-line bg-noir-soft/40 p-6"
          >
            <h2 className="mb-4 text-xs uppercase tracking-widest text-ivory-faint">
              Publish
            </h2>
            <StatusBadge status={product.status} />
            <label className="mt-4 block text-sm">
              <span className="text-[11px] uppercase tracking-widest text-ivory-faint">
                Status
              </span>
              <select
                name="status"
                defaultValue={product.status}
                className="mt-1 w-full rounded-lg border border-line bg-noir px-3 py-2 text-ivory"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="LOW_STOCK">Low stock</option>
                <option value="SOLD_OUT">Sold out</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
            <input type="hidden" name="name" value={product.name} />
            <input
              type="hidden"
              name="shortLine"
              value={product.shortLine ?? ""}
            />
            <input
              type="hidden"
              name="description"
              value={product.description ?? ""}
            />
            <input type="hidden" name="priceKes" value={product.priceKes} />
            <p className="mt-3 text-sm text-ivory-muted">
              {product.publishedAt
                ? `Published ${product.publishedAt.toLocaleDateString("en-KE")}`
                : "Not published yet"}
            </p>
            <p className="mt-1 text-sm text-ivory-faint">
              Listed at {formatKes(product.priceKes)}
            </p>
            <button
              type="submit"
              className="mt-4 w-full rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-xs uppercase tracking-widest text-gold"
            >
              Update
            </button>
          </form>
          <form action={archive}>
            <button
              type="submit"
              className="w-full rounded-full border border-line px-4 py-2 text-xs uppercase tracking-widest text-ivory-muted"
            >
              Archive
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
