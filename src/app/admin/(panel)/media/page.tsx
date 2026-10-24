import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";

export default async function MediaPage() {
  const assets = await prisma.mediaAsset.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Media Library" subtitle="Images · alt text · usage" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {assets.map((a) => (
          <figure
            key={a.id}
            className="overflow-hidden rounded-xl border border-line bg-noir-soft/40"
          >
            <div className="aspect-[4/3] bg-noir-elevated">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.url} alt={a.alt ?? ""} className="h-full w-full object-cover" />
            </div>
            <figcaption className="p-3 text-xs">
              <p className="truncate font-medium text-ivory">{a.filename}</p>
              <p className="mt-1 line-clamp-2 text-ivory-faint">
                {a.alt ?? "No alt text"}
              </p>
              <p className="mt-1 text-ivory-faint">Used {a.usageCount}×</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
