import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ category: string }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;
  
  // Redirect to marketplace with category filter
  redirect(`/marketplace/v2?category=${encodeURIComponent(category)}`);
}
