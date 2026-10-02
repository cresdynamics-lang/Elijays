import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";

export default async function AdminPagesPage() {
  const homepage = await prisma.page.findFirst({
    where: { key: "home", deletedAt: null },
    include: {
      sections: {
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return (
    <div>
      <PageHeader
        title="Pages and Sections"
        subtitle="Homepage · reorder · visibility"
      />
      <h2 className="mb-4 font-display text-lg text-ivory">
        {homepage?.title ?? "Homepage"} sections
      </h2>
      <ol className="space-y-2 rounded-xl border border-line bg-noir-soft/40 p-4">
        {(homepage?.sections ?? []).map((s, i) => (
          <li
            key={s.id}
            className="flex items-center justify-between rounded-lg border border-line/50 bg-noir/40 px-4 py-3"
          >
            <span className="text-sm text-ivory">
              <span className="mr-3 text-ivory-faint">{i + 1}.</span>
              {s.title ?? s.key}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                s.enabled
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-zinc-500/15 text-zinc-400"
              }`}
            >
              {s.enabled ? "ON" : "OFF"}
            </span>
          </li>
        ))}
        {!homepage?.sections.length ? (
          <li className="text-sm text-ivory-faint">No sections configured.</li>
        ) : null}
      </ol>
    </div>
  );
}
