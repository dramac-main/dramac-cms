import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSite } from "@/lib/actions/sites";
import { getPageWithContent, getPages } from "@/lib/actions/pages";
import { EditorWrapper } from "@/components/editor/editor-wrapper";

interface EditorPageProps {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: EditorPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const site = await getSite(resolvedParams.siteId).catch(() => null);
  return {
    title: site ? `Editor - ${site.name} | DRAMAC` : "Editor",
  };
}

export default async function EditorPage({
  params,
  searchParams,
}: EditorPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const site = await getSite(resolvedParams.siteId).catch(() => null);

  if (!site) {
    notFound();
  }

  // Get page ID from query or find homepage
  const pageId = resolvedSearchParams.page;

  if (!pageId) {
    const pages = await getPages(resolvedParams.siteId);
    const homepage = pages.find((p) => p.is_homepage);

    if (homepage) {
      redirect(`/dashboard/sites/${resolvedParams.siteId}/editor?page=${homepage.id}`);
    } else if (pages.length > 0) {
      redirect(`/dashboard/sites/${resolvedParams.siteId}/editor?page=${pages[0].id}`);
    } else {
      // No pages exist, redirect to create page
      redirect(`/dashboard/sites/${resolvedParams.siteId}/pages/new`);
    }
  }

  const page = await getPageWithContent(pageId!).catch(() => null);

  if (!page) {
    // Page not found, redirect to site
    redirect(`/dashboard/sites/${resolvedParams.siteId}`);
  }

  return (
    <EditorWrapper
      site={site}
      page={page}
    />
  );
}
