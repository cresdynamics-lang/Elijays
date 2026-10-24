import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatKes } from "@/components/admin/formatKes";
import { archiveProduct, updateProduct } from "../actions";
import { ProductAiAssist } from "@/components/admin/ProductAiAssist";
import { ProductStockEditor } from "../ProductStockEditor";
import { whatsappProductUpdateUrl } from "@/lib/constants";
import {
  SaveButton,
  SaveError,
  SaveForm,
  SaveScope,
} from "@/components/admin/SaveForm";

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const categories = await prisma.category.findMany({
    where: { deletedAt: null, parentId: null },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });
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
      images: {
        where: { deletedAt: null },
        include: { media: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!product) notFound();

  const colourNames = [
    ...new Set(
      product.variants
        .map((v) => v.colour)
        .filter((c): c is string => Boolean(c)),
    ),
  ];
  const sizeNames = [
    ...new Set(
      product.variants
        .map((v) => v.size)
        .filter((s): s is string => Boolean(s)),
    ),
  ];
  const colourImages = new Map<string, string>();
  for (const image of product.images) {
    if (image.colour && image.media.url && !colourImages.has(image.colour)) {
      colourImages.set(image.colour, image.media.url);
    }
  }
  const fallbackImage = product.images[0]?.media.url ?? null;
  const editorColours =
    colourNames.length > 0
      ? colourNames.map((name) => ({
          name,
          imageUrl: colourImages.get(name) ?? fallbackImage,
        }))
      : [{ name: "", imageUrl: fallbackImage }];
  const quantities = product.variants.map((v) => {
    const shop =
      v.stockLevels.find((l) => l.location.code === "SHOP") ?? v.stockLevels[0];
    return {
      colour: v.colour ?? "",
      size: v.size ?? "",
      quantity: shop?.quantity ?? 0,
    };
  });
  const alertAt =
    product.variants
      .flatMap((v) => v.stockLevels)
      .find((l) => l.location.code === "SHOP")?.alertAt ?? 2;

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
      <SaveScope>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <SaveForm
              id="product-details"
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
              <label className="block text-sm">
                <span className="text-[11px] uppercase tracking-widest text-ivory-faint">
                  Category
                </span>
                <select
                  name="categoryId"
                  defaultValue={product.categoryId ?? ""}
                  className="mt-1 w-full rounded-lg border border-line bg-noir px-3 py-2 text-ivory"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-xs text-ivory-faint">
                SKU {product.sku}
                {product.status === "DRAFT" && !product.publishedAt
                  ? " · Goes live on its own once it has a name, price, category and photo"
                  : ""}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <SaveButton className="rounded-full border border-gold/40 bg-gold/10 px-5 py-2 text-xs uppercase tracking-widest text-gold">
                  Save changes
                </SaveButton>
                <a
                  href={whatsappProductUpdateUrl({
                    name: product.name,
                    sku: product.sku,
                    shortLine: product.shortLine,
                    priceKes: product.priceKes,
                  })}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-line px-5 py-2 text-xs uppercase tracking-widest text-ivory-muted hover:text-gold"
                >
                  Test on WhatsApp
                </a>
              </div>
              <SaveError />
            </SaveForm>

            <ProductStockEditor
              productId={product.id}
              colours={editorColours}
              sizes={sizeNames}
              quantities={quantities}
              alertAt={alertAt}
            />
          </div>

          <aside className="space-y-6">
            <ProductAiAssist productId={product.id} />
            {/* Fields here belong to the main product form (form="product-details"),
              so Update saves the same values as Save changes. */}
            <div className="rounded-xl border border-line bg-noir-soft/40 p-6">
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
                  form="product-details"
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
              <p className="mt-3 text-sm text-ivory-muted">
                {product.publishedAt
                  ? `Published ${product.publishedAt.toLocaleDateString("en-KE")}`
                  : "Not published yet"}
              </p>
              <p className="mt-1 text-sm text-ivory-faint">
                Listed at {formatKes(product.priceKes)}
              </p>
              <SaveButton
                form="product-details"
                className="mt-4 w-full rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-xs uppercase tracking-widest text-gold"
              >
                Update
              </SaveButton>
              <SaveError className="mt-2" />
            </div>
            {/* Own scope so Archive's spinner doesn't light up the save buttons. */}
            <SaveScope>
              <SaveForm action={archive}>
                <SaveButton
                  pendingLabel="Archiving…"
                  savedLabel="Archived ✓"
                  className="w-full rounded-full border border-line px-4 py-2 text-xs uppercase tracking-widest text-ivory-muted"
                >
                  Archive
                </SaveButton>
                <SaveError className="mt-2" />
              </SaveForm>
            </SaveScope>
          </aside>
        </div>
      </SaveScope>
    </div>
  );
}
