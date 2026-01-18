import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import {
  ArrowLeft,
  Mail,
  Building2,
  Calendar,
  Shield,
  Key,
  UserX,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { ROLE_LABELS, type UserRole } from "@/types/roles";

export const metadata: Metadata = {
  title: "User Details | Admin | DRAMAC",
};

interface UserDetailPageProps {
  params: Promise<{ userId: string }>;
}

async function getUserDetails(userId: string) {
  await requireSuperAdmin();
  const supabase = await createClient();

  // Get user profile
  const { data: user, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return null;
  }

  // Get agency memberships
  const { data: memberships } = await supabase
    .from("agency_members")
    .select("role, agency_id")
    .eq("user_id", userId);

  // Get agency details for each membership
  const agencyIds = memberships?.map((m) => m.agency_id) || [];
  const { data: agencies } = agencyIds.length > 0
    ? await supabase
        .from("agencies")
        .select("id, name, slug")
        .in("id", agencyIds)
    : { data: [] };

  // Map memberships with agency details
  const agencyMemberships = (memberships || []).map((m) => {
    const agency = agencies?.find((a) => a.id === m.agency_id);
    return {
      role: m.role,
      agency: agency || null,
    };
  });

  // Get user's sites count (only if they have an agency)
  let sitesCount = 0;
  if (user.agency_id) {
    const { count } = await supabase
      .from("sites")
      .select("*", { count: "exact", head: true })
      .eq("agency_id", user.agency_id);
    sitesCount = count || 0;
  }

  return {
    ...user,
    sites_count: sitesCount,
    agency_members: agencyMemberships,
  };
}

const roleColors: Record<string, string> = {
  super_admin: "bg-red-100 text-red-800",
  agency_owner: "bg-yellow-100 text-yellow-800",
  agency_admin: "bg-blue-100 text-blue-800",
  agency_member: "bg-green-100 text-green-800",
  client: "bg-gray-100 text-gray-800",
};

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { userId } = await params;
  const user = await getUserDetails(userId);

  if (!user) {
    notFound();
  }

  const agencies = user.agency_members || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Link>
        </Button>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-2xl font-bold">
                  {user.name || "Unnamed User"}
                </h1>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className={roleColors[user.role] || ""}
                >
                  {ROLE_LABELS[user.role as UserRole] || user.role}
                </Badge>
                <Badge variant="outline">active</Badge>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
              <Button variant="outline" size="sm">
                <Key className="w-4 h-4 mr-2" />
                Reset Password
              </Button>
              {user.role !== "super_admin" && (
                <>
                  <Button variant="outline" size="sm">
                    <Shield className="w-4 h-4 mr-2" />
                    Impersonate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    Suspend
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Joined</p>
                <p className="font-medium">
                  {user.created_at
                    ? format(new Date(user.created_at), "PPP")
                    : "Unknown"}
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {user.updated_at
                    ? format(new Date(user.updated_at), "PPP")
                    : "Never"}
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Sites Created</p>
                <p className="font-medium">{user.sites_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agency Memberships */}
        <Card>
          <CardHeader>
            <CardTitle>Agency Memberships</CardTitle>
          </CardHeader>
          <CardContent>
            {agencies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Not a member of any agency
              </p>
            ) : (
              <div className="space-y-4">
                {agencies
                  .filter((m) => m.agency !== null)
                  .map((membership) => (
                  <div
                    key={membership.agency!.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{membership.agency!.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {membership.agency!.slug}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{membership.role}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Activity logging is not yet enabled. Enable the activity_logs table
            to track user actions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
