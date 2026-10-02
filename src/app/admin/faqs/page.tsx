import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";

export default async function FaqsPage() {
  const [faqs, policies] = await Promise.all([
    prisma.faq.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.policy.findMany({
      where: { deletedAt: null },
      orderBy: { title: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader title="FAQs and Policies" subtitle="Customer help · legal copy" />
      <h2 className="mb-4 font-display text-lg text-ivory">FAQs</h2>
      <ul className="mb-10 space-y-3 rounded-xl border border-line bg-noir-soft/40 p-4">
        {faqs.map((f) => (
          <li key={f.id}>
            <p className="text-sm font-medium text-ivory">{f.question}</p>
            <p className="mt-1 text-sm text-ivory-muted line-clamp-2">{f.answer}</p>
          </li>
        ))}
      </ul>
      <h2 className="mb-4 font-display text-lg text-ivory">Policies</h2>
      <ul className="space-y-3 rounded-xl border border-line bg-noir-soft/40 p-4">
        {policies.map((p) => (
          <li key={p.id}>
            <p className="text-sm font-medium text-ivory">{p.title}</p>
            <p className="text-xs text-ivory-faint">{p.key}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
