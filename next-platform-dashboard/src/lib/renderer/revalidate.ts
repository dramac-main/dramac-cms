export async function triggerRevalidation(
  type: "site" | "page",
  siteSlug: string,
  pageSlug?: string
) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.REVALIDATION_SECRET}`,
      },
      body: JSON.stringify({
        type,
        siteSlug,
        pageSlug,
      }),
    });
  } catch (error) {
    console.error("Failed to trigger revalidation:", error);
  }
}

// Call this when a site is published
export async function onSitePublish(siteSlug: string) {
  await triggerRevalidation("site", siteSlug);
}

// Call this when a page is published
export async function onPagePublish(siteSlug: string, pageSlug: string) {
  await triggerRevalidation("page", siteSlug, pageSlug);
}
