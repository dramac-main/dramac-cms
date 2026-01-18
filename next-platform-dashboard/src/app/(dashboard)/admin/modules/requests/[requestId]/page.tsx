import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { RequestDetailCard } from "@/components/modules/admin/request-detail-card";

export const metadata: Metadata = {
  title: "Request Details | Super Admin",
  description: "View and manage module request",
};

// Note: Using 'as any' for new tables until Supabase types are regenerated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

interface PageProps {
  params: Promise<{ requestId: string }>;
}

export default async function RequestDetailPage({ params }: PageProps) {
  const { requestId } = await params;
  const supabase = await createClient() as AnySupabase;
  
  // Verify super admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
    
  if (profile?.role !== "super_admin") {
    redirect("/dashboard");
  }

  // Get request with agency info
  let request = null;
  try {
    const { data, error } = await supabase
      .from("module_requests")
      .select(`
        *,
        agency:agencies(id, name),
        submitter:profiles!submitted_by(id, name, email)
      `)
      .eq("id", requestId)
      .single();
    
    if (error || !data) {
      notFound();
    }
    request = data;
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/modules/requests">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Link href="/admin/modules" className="hover:underline">
              Module Management
            </Link>
            <span>/</span>
            <Link href="/admin/modules/requests" className="hover:underline">
              Requests
            </Link>
            <span>/</span>
            <span>Details</span>
          </div>
          <h1 className="text-3xl font-bold">Request Details</h1>
        </div>
      </div>

      {/* Request Detail */}
      <RequestDetailCard request={request} />
    </div>
  );
}
