import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import {
  ArrowLeft,
  Building2,
  Users,
  Globe,
  Calendar,
  Trash2,
  Mail,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Agency Details | Admin | DRAMAC",
};

interface AgencyDetailPageProps {
  params: Promise<{ agencyId: string }>;
}

async function getAgencyDetails(agencyId: string) {
  await requireSuperAdmin();
  const supabase = await createClient();

  // Get agency
  const { data: agency, error } = await supabase
    .from("agencies")
    .select("*")
    .eq("id", agencyId)
    .single();

  if (error || !agency) {
    return null;
  }

  // Get owner separately
  const { data: owner } = await supabase
    .from("profiles")
    .select("id, name, email, avatar_url")
    .eq("id", agency.owner_id)
    .single();

  // Get agency members
  const { data: members } = await supabase
    .from("agency_members")
    .select("id, role, invited_at, user_id")
    .eq("agency_id", agencyId);

  // Get member profiles
  const memberUserIds = members?.map((m) => m.user_id) || [];
  const { data: memberProfiles } = memberUserIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, name, email, avatar_url")
        .in("id", memberUserIds)
    : { data: [] };

  // Map members to include profile data
  const membersWithProfiles = (members || []).map((member) => {
    const profile = memberProfiles?.find((p) => p.id === member.user_id);
    return {
      id: member.id,
      role: member.role,
      invited_at: member.invited_at,
      user: profile || { id: member.user_id, name: null, email: "", avatar_url: null },
    };
  });

  // Get clients
  const { data: clients, count: clientCount } = await supabase
    .from("clients")
    .select("id, name, email, created_at", { count: "exact" })
    .eq("agency_id", agencyId)
    .limit(10);

  // Get sites
  const { data: sites, count: siteCount } = await supabase
    .from("sites")
    .select("id, name, subdomain, published, created_at", { count: "exact" })
    .eq("agency_id", agencyId)
    .limit(10);

  return {
    ...agency,
    owner: owner || null,
    members: membersWithProfiles,
    clients: clients || [],
    client_count: clientCount || 0,
    sites: sites || [],
    site_count: siteCount || 0,
  };
}

export default async function AgencyDetailPage({ params }: AgencyDetailPageProps) {
  const { agencyId } = await params;
  const agency = await getAgencyDetails(agencyId);

  if (!agency) {
    notFound();
  }

  const owner = agency.owner;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/agencies">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Agencies
          </Link>
        </Button>
      </div>

      {/* Agency Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-24 h-24 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-12 h-12 text-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-2xl font-bold">{agency.name}</h1>
                <p className="text-muted-foreground">{agency.slug}</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {agency.members.length} members
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{agency.client_count} clients</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{agency.site_count} sites</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Agency
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Owner Information */}
        <Card>
          <CardHeader>
            <CardTitle>Owner</CardTitle>
          </CardHeader>
          <CardContent>
            {owner ? (
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={owner.avatar_url || undefined} />
                  <AvatarFallback>
                    {(owner.name || owner.email).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{owner.name || "Unnamed"}</p>
                  <p className="text-sm text-muted-foreground">{owner.email}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/users/${owner.id}`}>View</Link>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No owner assigned</p>
            )}
          </CardContent>
        </Card>

        {/* Agency Information */}
        <Card>
          <CardHeader>
            <CardTitle>Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {agency.created_at ? format(new Date(agency.created_at), "PPP") : "N/A"}
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {agency.updated_at
                    ? format(new Date(agency.updated_at), "PPP")
                    : "Never"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {agency.members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No team members
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agency.members.map((member: {
                  id: string;
                  role: string;
                  invited_at: string;
                  user: { id: string; name: string | null; email: string; avatar_url: string | null };
                }) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage
                            src={member.user?.avatar_url || undefined}
                          />
                          <AvatarFallback>
                            {(member.user?.name || member.user?.email || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {member.user?.name || "Unnamed"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.user?.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{member.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(member.invited_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/users/${member.user?.id}`}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Sites */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sites ({agency.site_count})</CardTitle>
        </CardHeader>
        <CardContent>
          {agency.sites.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No sites created
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agency.sites.map((site: {
                  id: string;
                  name: string;
                  subdomain: string;
                  published: boolean;
                  created_at: string;
                }) => (
                  <TableRow key={site.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{site.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {site.subdomain}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          site.published ? "default" : "secondary"
                        }
                      >
                        {site.published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(site.created_at), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Clients */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Clients ({agency.client_count})</CardTitle>
        </CardHeader>
        <CardContent>
          {agency.clients.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No clients
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agency.clients.map((client: {
                  id: string;
                  name: string;
                  email: string | null;
                  created_at: string;
                }) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {client.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(client.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Mail className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
