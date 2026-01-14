import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  Globe,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import type { Client } from "@/types/client";
import type { Database } from "@/types/database";

type Site = Database["public"]["Tables"]["sites"]["Row"];

interface ClientOverviewProps {
  client: Client & { sites?: Site[] };
}

const statusColors = {
  active: "bg-success text-success-foreground",
  inactive: "bg-muted text-muted-foreground",
  archived: "bg-danger text-danger-foreground",
};

export function ClientOverview({ client }: ClientOverviewProps) {
  const initials = client.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const stats = [
    {
      label: "Total Sites",
      value: client.sites?.length || 0,
      icon: Globe,
    },
    {
      label: "Published Sites",
      value: client.sites?.filter((site) => site.published).length || 0,
      icon: FileText,
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Profile Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold">{client.name}</h3>
              {client.company && (
                <p className="text-muted-foreground">{client.company}</p>
              )}
              <Badge className={statusColors[client.status as keyof typeof statusColors]}>
                {client.status}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            {client.email && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a
                    href={`mailto:${client.email}`}
                    className="font-medium hover:underline"
                  >
                    {client.email}
                  </a>
                </div>
              </div>
            )}

            {client.phone && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <a
                    href={`tel:${client.phone}`}
                    className="font-medium hover:underline"
                  >
                    {client.phone}
                  </a>
                </div>
              </div>
            )}

            {client.company && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">{client.company}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {format(new Date(client.created_at), "MMM d, yyyy")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {format(new Date(client.updated_at), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          </div>

          {client.notes && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Notes</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {client.notes}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="space-y-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
