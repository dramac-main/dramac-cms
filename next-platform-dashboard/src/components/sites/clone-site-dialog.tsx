"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2 } from "lucide-react";
import { getSiteUrl, getSiteDomain, getBaseDomain } from "@/lib/utils/site-url";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cloneSiteAction } from "@/lib/actions/clone";

interface CloneSiteDialogProps {
  siteId: string;
  siteName: string;
  clientId: string;
  agencyId: string;
  children?: React.ReactNode;
}

export function CloneSiteDialog({
  siteId,
  siteName,
  clientId,
  agencyId,
  children,
}: CloneSiteDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState(`${siteName} (Copy)`);
  const [subdomain, setSubdomain] = useState("");
  const [clonePages, setClonePages] = useState(true);
  const [cloneSettings, setCloneSettings] = useState(true);
  const [cloneModules, setCloneModules] = useState(true);
  
  const router = useRouter();

  // Generate subdomain from name
  const generateSubdomain = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 63);
  };

  // Auto-generate subdomain when name changes
  const handleNameChange = (name: string) => {
    setNewName(name);
    if (!subdomain || subdomain === generateSubdomain(newName)) {
      setSubdomain(generateSubdomain(name));
    }
  };

  const handleClone = async () => {
    if (!subdomain.trim()) {
      toast.error("Please enter a subdomain");
      return;
    }

    if (subdomain.length < 3) {
      toast.error("Subdomain must be at least 3 characters");
      return;
    }

    setLoading(true);
    try {
      const result = await cloneSiteAction(siteId, {
        newName,
        newSubdomain: subdomain.toLowerCase().replace(/[^a-z0-9-]/g, ""),
        clonePages,
        cloneSettings,
        cloneModules,
        clientId,
        agencyId,
      });

      if (result.success) {
        toast.success("Site cloned!", {
          description: `${result.details?.pagesCloned || 0} pages and ${result.details?.modulesCloned || 0} modules copied.`,
        });
        setOpen(false);
        router.push(`/dashboard/sites/${result.newSiteId}`);
      } else {
        toast.error("Clone failed", {
          description: result.error,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Reset form when opening
      setNewName(`${siteName} (Copy)`);
      setSubdomain(generateSubdomain(`${siteName} copy`));
      setClonePages(true);
      setCloneSettings(true);
      setCloneModules(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Copy className="mr-2 h-4 w-4" />
            Clone Site
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Clone Site</DialogTitle>
          <DialogDescription>
            Create a copy of &quot;{siteName}&quot; with all selected data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newName">New Site Name</Label>
            <Input
              id="newName"
              value={newName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="My New Site"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subdomain">Subdomain</Label>
            <div className="flex items-center gap-2">
              <Input
                id="subdomain"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder="my-new-site"
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">.{getBaseDomain()}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <Label>Clone Options</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="clonePages"
                checked={clonePages}
                onCheckedChange={(checked) => setClonePages(!!checked)}
              />
              <Label htmlFor="clonePages" className="font-normal cursor-pointer">
                Clone all pages
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cloneSettings"
                checked={cloneSettings}
                onCheckedChange={(checked) => setCloneSettings(!!checked)}
              />
              <Label htmlFor="cloneSettings" className="font-normal cursor-pointer">
                Clone site settings &amp; theme
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cloneModules"
                checked={cloneModules}
                onCheckedChange={(checked) => setCloneModules(!!checked)}
              />
              <Label htmlFor="cloneModules" className="font-normal cursor-pointer">
                Clone enabled modules
              </Label>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleClone} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cloning...
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Clone Site
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
