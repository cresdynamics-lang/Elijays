import type { Metadata } from "next";
import { getCategoryById } from "@/lib/navigation";
import {
  SubcategoryView,
  subcategoryMetadata,
} from "@/components/SubcategoryView";

type Props = { params: Promise<{ sub: string }> };

export async function generateStaticParams() {
  const cat = getCategoryById("trousers");
  return (cat?.links || [])
    .filter((l) => l.href.startsWith("/trousers/"))
    .map((l) => ({ sub: l.href.split("/").pop()! }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sub } = await params;
  return subcategoryMetadata("trousers", sub);
}

export default async function Page({ params }: Props) {
  const { sub } = await params;
  return <SubcategoryView categoryId="trousers" sub={sub} />;
}
