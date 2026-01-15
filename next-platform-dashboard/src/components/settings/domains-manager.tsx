"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Globe, CheckCircle2, XCircle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Domain {
  id: string;
  domain: string;
  status: "pending" | "verified" | "failed";
  type: "agency" | "site";
}

interface DomainsManagerProps {
  agencyId: string;
}

export function DomainsManager({ agencyId }: DomainsManagerProps) {
  const [domains, setDomains] = useState<Domain[]>([
    // Mock data - in production would be fetched from the server
  ]);
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddDomain = async () => {
    if (!newDomain) return;

    setIsAddingDomain(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const domain: Domain = {
        id: Date.now().toString(),
        domain: newDomain,
        status: "pending",
        type: "agency",
      };

      setDomains((prev) => [...prev, domain]);
      setNewDomain("");
      setIsDialogOpen(false);
      toast.success("Domain added. Please configure DNS settings.");
    } catch (error) {
      toast.error("Failed to add domain");
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleRemoveDomain = async (domainId: string) => {
    try {
      setDomains((prev) => prev.filter((d) => d.id !== domainId));
      toast.success("Domain removed");
    } catch (error) {
      toast.error("Failed to remove domain");
    }
  };

  const getStatusBadge = (status: Domain["status"]) => {
    switch (status) {
      case "verified":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Domain
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Domain</DialogTitle>
              <DialogDescription>
                Enter the domain you want to connect. You&apos;ll need to configure
                DNS settings after adding.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="flex gap-2">
                <Input
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                />
                <Button onClick={handleAddDomain} disabled={isAddingDomain || !newDomain}>
                  {isAddingDomain && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add
                </Button>
              </div>

              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium">DNS Configuration:</p>
                <div className="bg-muted p-3 rounded-md font-mono text-xs">
                  <p>Type: CNAME</p>
                  <p>Name: @</p>
                  <p>Value: domains.dramac.com</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {domains.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No custom domains configured</p>
          <p className="text-sm">Add a domain to use your own branding</p>
        </div>
      ) : (
        <div className="divide-y">
          {domains.map((domain) => (
            <div
              key={domain.id}
              className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-4">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{domain.domain}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {domain.type} domain
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {getStatusBadge(domain.status)}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveDomain(domain.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
