import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { setReviewStatus } from "./actions";

export default async function ReviewsPage() {
  const reviews = await prisma.review.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { product: true },
  });

  const pending = reviews.filter((r) => r.status === "PENDING");

  return (
    <div>
      <PageHeader
        title="Reviews"
        subtitle={`${pending.length} pending approval`}
      />
      <ul className="space-y-4">
        {reviews.map((r) => (
          <li
            key={r.id}
            className="rounded-xl border border-line bg-noir-soft/40 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-ivory">
                  {r.authorName} · {"★".repeat(r.rating)}
                </p>
                <p className="mt-1 text-sm text-ivory-muted">{r.body}</p>
                {r.product ? (
                  <p className="mt-2 text-xs text-ivory-faint">{r.product.name}</p>
                ) : null}
              </div>
              <StatusBadge status={r.status} />
            </div>
            {r.status === "PENDING" ? (
              <div className="mt-4 flex gap-2">
                <form
                  action={async () => {
                    "use server";
                    await setReviewStatus(r.id, "APPROVED");
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-full border border-emerald-500/40 px-3 py-1 text-xs text-emerald-300 transition hover:bg-emerald-500/10"
                  >
                    Approve
                  </button>
                </form>
                <form
                  action={async () => {
                    "use server";
                    await setReviewStatus(r.id, "HIDDEN");
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-full border border-line px-3 py-1 text-xs text-ivory-muted transition hover:bg-white/5"
                  >
                    Hide
                  </button>
                </form>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
