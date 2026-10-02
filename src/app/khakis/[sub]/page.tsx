import type { Metadata } from "next";
import { getCategoryById } from "@/lib/navigation";
import {
  SubcategoryView,
  subcategoryMetadata,
} from "@/components/SubcategoryView";

type Props = { params: Promise<{ sub: string }> };

export async function generateStaticParams() {
  const cat = getCategoryById("khakis");
  return (cat?.links || [])
    .filter((l) => l.href.startsWith("/khakis/"))
    .map((l) => ({ sub: l.href.split("/").pop()! }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sub } = await params;
  return subcategoryMetadata("khakis", sub);
}

export default async function Page({ params }: Props) {
  const { sub } = await params;
  return <SubcategoryView categoryId="khakis" sub={sub} />;
}
