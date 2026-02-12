import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ domain: string }> }
) {
  const { domain: domainId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const contact = await request.json();

    // Validate required fields
    if (!contact.name || !contact.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Update domain contact info in our database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("domains")
      .update({
        registrant_contact: {
          name: contact.name,
          organization: contact.organization || "",
          email: contact.email,
          phone: contact.phone || "",
          address: contact.address || "",
          city: contact.city || "",
          state: contact.state || "",
          country: contact.country || "",
          zipcode: contact.zipcode || "",
        },
      })
      .eq("id", domainId);

    if (error) {
      console.error("[Domains] Contact update error:", error);
      return NextResponse.json(
        { error: "Failed to update contact" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Domains] Contact update error:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }
}
