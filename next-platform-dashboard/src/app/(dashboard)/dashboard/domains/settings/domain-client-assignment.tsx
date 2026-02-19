"use client";

// src/app/(dashboard)/dashboard/domains/settings/domain-client-assignment.tsx
// Client component for bulk domain-to-client assignment on the settings page

import { useState } from "react";
import Link from "next/link";
import {
  Globe,
  Users,
  Link as LinkIcon,
  Check,
  Loader2,
  Search,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { assignDomainToClient } from "@/lib/actions/domains";

interface DomainItem {
  id: string;
  domain_name: string;
  client_id: string | null;
  site_id: string | null;
  status: string;
}

interface ClientItem {
  id: string;
  name: string;
  company: string | null;
}

interface SiteItem {
  id: string;
  name: string;
  subdomain: string;
}

interface DomainClientAssignmentSectionProps {
  domains: DomainItem[];
  clients: ClientItem[];
  sites: SiteItem[];
}

export function DomainClientAssignmentSection({
  domains: initialDomains,
  clients,
  sites,
}: DomainClientAssignmentSectionProps) {
  const [domains, setDomains] = useState(initialDomains);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "assigned" | "unassigned">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredDomains = domains.filter((d) => {
    const matchesSearch = d.domain_name
      .toLowerCase()
      .includes(search.toLowerCase());
    if (filter === "assigned") return matchesSearch && d.client_id;
    if (filter === "unassigned") return matchesSearch && !d.client_id;
    return matchesSearch;
  });

  const getClientName = (clientId: string | null) => {
    if (!clientId) return null;
    const client = clients.find((c) => c.id === clientId);
    return client ? client.company || client.name : "Unknown Client";
  };

  const handleAssign = async (domainId: string, clientId: string | null) => {
    setUpdatingId(domainId);
    try {
      const result = await assignDomainToClient(domainId, clientId, null);
      if (result.success) {
        setDomains((prev) =>
          prev.map((d) =>
            d.id === domainId ? { ...d, client_id: clientId } : d
          )
        );
        toast.success(
          clientId ? "Domain assigned to client" : "Domain unassigned"
        );
      } else {
        toast.error(result.error || "Failed to update assignment");
      }
    } catch {
      toast.error("Failed to update assignment");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Client Domain Assignment
        </CardTitle>
        <CardDescription>
          Assign your domains to specific clients for tracking. You can also
          assign from individual domain pages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search domains..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={filter}
            onValueChange={(v) =>
              setFilter(v as "all" | "assigned" | "unassigned")
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Domain List */}
        {filteredDomains.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>
              {domains.length === 0
                ? "No domains found. Register your first domain to get started."
                : "No domains match your search."}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredDomains.map((domain) => (
              <div
                key={domain.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/domains/${domain.id}`}
                      className="text-sm font-medium hover:underline truncate block"
                    >
                      {domain.domain_name}
                    </Link>
                    {domain.client_id && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {getClientName(domain.client_id)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {updatingId === domain.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Select
                      value={domain.client_id || "none"}
                      onValueChange={(v) =>
                        handleAssign(domain.id, v === "none" ? null : v)
                      }
                    >
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue placeholder="Assign to client..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">
                            No client
                          </span>
                        </SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.company || client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {domains.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t text-sm text-muted-foreground">
            <span>
              {filteredDomains.length} of {domains.length} domains shown
            </span>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/domains">
                View all domains <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
