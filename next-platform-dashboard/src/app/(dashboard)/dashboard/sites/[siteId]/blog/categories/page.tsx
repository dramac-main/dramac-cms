import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryManager } from "@/components/blog/category-manager";

export default function CategoriesPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = use(params);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/sites/${siteId}/blog`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tags className="h-6 w-6" />
            Blog Categories
          </h1>
          <p className="text-muted-foreground mt-1">
            Organize your blog posts with categories
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Create and manage categories to help organize your blog posts.
            Categories can only be deleted when they have no associated posts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryManager siteId={siteId} />
        </CardContent>
      </Card>
    </div>
  );
}
