import Link from "next/link";
import { FileText, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPortalBlogSites } from "@/lib/blog/post-service";

export default async function PortalBlogPage() {
  const { sites } = await getPortalBlogSites();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Blog
        </h1>
        <p className="text-muted-foreground mt-1">
          View published blog posts for your sites
        </p>
      </div>

      {sites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Sites Available</h3>
            <p className="text-muted-foreground">
              You don&apos;t have access to any sites with blog posts.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <Card key={site.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{site.name}</span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardTitle>
                <CardDescription className="truncate">
                  {site.domain || "No domain set"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={`/portal/blog/${site.id}`}>
                    View Blog Posts
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
