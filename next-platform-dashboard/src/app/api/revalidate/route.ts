import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    // Verify revalidation secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.REVALIDATION_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, siteSlug, pageSlug } = body;

    if (type === "site") {
      // Revalidate entire site
      revalidateTag("site", "default");
      if (siteSlug) {
        revalidatePath(`/site/${siteSlug}`);
      }
    } else if (type === "page" && siteSlug) {
      // Revalidate specific page
      if (pageSlug) {
        revalidatePath(`/site/${siteSlug}/${pageSlug}`);
      } else {
        revalidatePath(`/site/${siteSlug}`);
      }
    } else {
      // Revalidate everything
      revalidateTag("site", "default");
    }

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { error: "Failed to revalidate" },
      { status: 500 }
    );
  }
}
