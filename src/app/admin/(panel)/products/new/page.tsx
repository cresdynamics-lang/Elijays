import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProductComposer } from "../ProductComposer";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    where: { deletedAt: null, parentId: null },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <PageHeader
        title="New product"
        subtitle="Saves as you type. Publish when ready — drafts only exist if you leave mid-way."
      />
      <ProductComposer categories={categories} />
    </div>
  );
}
