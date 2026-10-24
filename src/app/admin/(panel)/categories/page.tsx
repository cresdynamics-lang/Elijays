import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";

type CategoryRow = Awaited<
  ReturnType<typeof prisma.category.findMany>
>[number];

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id: selectedId } = await searchParams;

  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
    include: { children: { where: { deletedAt: null } } },
  });

  const roots = categories.filter((c) => !c.parentId);
  const selected =
    categories.find((c) => c.id === selectedId) ?? roots[0] ?? null;

  return (
    <div>
      <PageHeader
        title="Categories and Navigation"
        subtitle="Shop structure · mega menu"
      />
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-noir-soft/40 p-4">
          <h2 className="mb-3 text-xs uppercase tracking-widest text-ivory-faint">
            Category tree
          </h2>
          <CategoryTree nodes={roots} all={categories} selectedId={selected?.id} />
        </section>

        <section className="rounded-xl border border-line bg-noir-soft/40 p-6">
          {selected ? (
            <>
              <h2 className="mb-4 font-display text-lg text-ivory">{selected.name}</h2>
              <dl className="space-y-3 text-sm">
                <Row label="Slug" value={selected.slug} />
                <Row label="Headline" value={selected.headline ?? "—"} />
                <Row label="Subline" value={selected.subline ?? "—"} />
                <Row label="CTA" value={selected.ctaLabel ?? "—"} />
                <Row label="Enabled" value={selected.enabled ? "ON" : "OFF"} />
                <Row label="Sort order" value={String(selected.sortOrder)} />
              </dl>
            </>
          ) : (
            <p className="text-sm text-ivory-faint">No categories yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function CategoryTree({
  nodes,
  all,
  selectedId,
  depth = 0,
}: {
  nodes: CategoryRow[];
  all: CategoryRow[];
  selectedId?: string;
  depth?: number;
}) {
  return (
    <ul className={depth ? "ml-4 border-l border-line/50 pl-3" : ""}>
      {nodes.map((node) => {
        const children = all.filter((c) => c.parentId === node.id);
        const active = node.id === selectedId;
        return (
          <li key={node.id} className="py-1">
            <a
              href={`/admin/categories?id=${node.id}`}
              className={`text-sm ${active ? "text-gold" : "text-ivory-muted hover:text-ivory"}`}
            >
              {node.name}
            </a>
            {children.length > 0 ? (
              <CategoryTree
                nodes={children}
                all={all}
                selectedId={selectedId}
                depth={depth + 1}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-widest text-ivory-faint">
        {label}
      </dt>
      <dd className="text-ivory">{value}</dd>
    </div>
  );
}
