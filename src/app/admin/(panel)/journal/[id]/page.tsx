import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";

export default async function JournalEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await prisma.post.findFirst({
    where: { id, deletedAt: null },
    include: { tags: true },
  });
  if (!post) notFound();

  return (
    <div>
      <PageHeader title="Edit post" subtitle={post.slug} />
      <form className="max-w-3xl space-y-4 rounded-xl border border-line bg-noir-soft/40 p-6">
        <div className="flex items-center gap-3">
          <StatusBadge status={post.status} />
          <span className="text-xs text-ivory-faint">{post.views} views</span>
        </div>
        <Field label="Title" defaultValue={post.title} />
        <Field label="Excerpt" defaultValue={post.excerpt ?? ""} />
        <Field label="Category" defaultValue={post.category ?? ""} />
        <label className="block text-sm">
          <span className="text-[11px] uppercase tracking-widest text-ivory-faint">
            Body
          </span>
          <textarea
            rows={12}
            defaultValue={post.body}
            className="mt-1 w-full rounded-lg border border-line bg-noir px-3 py-2 text-ivory"
          />
        </label>
        <Field label="SEO title" defaultValue={post.seoTitle ?? ""} />
        <button type="button" disabled className="text-xs text-ivory-faint">
          Save (wire later)
        </button>
      </form>
    </div>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <label className="block text-sm">
      <span className="text-[11px] uppercase tracking-widest text-ivory-faint">
        {label}
      </span>
      <input
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-lg border border-line bg-noir px-3 py-2 text-ivory"
      />
    </label>
  );
}
