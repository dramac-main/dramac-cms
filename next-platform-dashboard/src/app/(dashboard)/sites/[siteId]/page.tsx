import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSite } from "@/lib/actions/sites";
import { getSiteUrl, getSiteDomain, getBaseDomain } from "@/lib/utils/site-url";
import { PageHeader } from "@/components/layout/page-header";
import { SiteDetailTabs } from "@/components/sites/site-detail-tabs";
import { Button } from "@/components/ui/button";
import { Edit, ExternalLink } from "lucide-react";
import Link from "next/link";

interface SiteDetailPageProps {
  params: Promise<{ siteId: string }>;
}

export async function generateMetadata({ params }: SiteDetailPageProps): Promise<Metadata> {
  const { siteId } = await params;
  const site = await getSite(siteId);
  
  return {
    title: site ? `${site.name} | DRAMAC` : "Site Not Found",
  };
}

export default async function SiteDetailPage({ params }: SiteDetailPageProps) {
  const { siteId } = await params;
  const site = await getSite(siteId);

  if (!site) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={site.name}
        description={getSiteDomain(site.subdomain, site.custom_domain)}
        backHref="/dashboard/sites"
      >
        <div className="flex items-center gap-2">
          {site.published && (
            <a
              href={getSiteUrl(site.subdomain, site.custom_domain)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Live
              </Button>
            </a>
          )}
          <Link href={`/editor/${site.id}`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Open Editor
            </Button>
          </Link>
        </div>
      </PageHeader>

      <SiteDetailTabs site={site} />
    </div>
  );
}
