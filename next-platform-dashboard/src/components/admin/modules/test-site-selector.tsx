"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Globe, AlertCircle } from "lucide-react";
import { getAvailableSitesForTesting } from "@/lib/modules/test-site-manager";

interface SiteOption {
  id: string;
  name: string;
  slug: string;
  agencyName: string;
  isTestSite: boolean;
}

interface TestSiteSelectorProps {
  value?: string;
  onChange: (siteId: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  showOnlyTestSites?: boolean;
  className?: string;
}

export function TestSiteSelector({
  value,
  onChange,
  placeholder = "Select a test site",
  disabled = false,
  showOnlyTestSites = true,
  className,
}: TestSiteSelectorProps) {
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSites() {
      try {
        setLoading(true);
        setError(null);
        const availableSites = await getAvailableSitesForTesting();
        
        // Filter to only test sites if requested
        const filteredSites = showOnlyTestSites
          ? availableSites.filter((s) => s.isTestSite)
          : availableSites;
        
        setSites(filteredSites);
      } catch (err) {
        console.error("Failed to load sites:", err);
        setError("Failed to load sites");
      } finally {
        setLoading(false);
      }
    }

    loadSites();
  }, [showOnlyTestSites]);

  const selectedSite = sites.find((s) => s.id === value);

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        {error}
      </div>
    );
  }

  return (
    <Select
      value={value}
      onValueChange={(val) => onChange(val === "none" ? undefined : val)}
      disabled={disabled || loading}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={loading ? "Loading sites..." : placeholder}>
          {selectedSite && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>{selectedSite.name}</span>
              {selectedSite.isTestSite && (
                <Badge variant="secondary" className="text-xs">
                  Test
                </Badge>
              )}
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">No site selected</span>
        </SelectItem>
        {sites.length === 0 && !loading ? (
          <div className="py-4 px-2 text-center text-sm text-muted-foreground">
            {showOnlyTestSites
              ? "No test sites configured"
              : "No sites available"}
          </div>
        ) : (
          sites.map((site) => (
            <SelectItem key={site.id} value={site.id}>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="font-medium">{site.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {site.agencyName} • {site.slug}
                  </span>
                </div>
                {site.isTestSite && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Test Site
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

interface TestSiteSelectorStaticProps {
  sites: SiteOption[];
  value?: string;
  onChange: (siteId: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Static version that receives sites as props (for server-side data)
 */
export function TestSiteSelectorStatic({
  sites,
  value,
  onChange,
  placeholder = "Select a test site",
  disabled = false,
  className,
}: TestSiteSelectorStaticProps) {
  const selectedSite = sites.find((s) => s.id === value);

  return (
    <Select
      value={value}
      onValueChange={(val) => onChange(val === "none" ? undefined : val)}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {selectedSite && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>{selectedSite.name}</span>
              {selectedSite.isTestSite && (
                <Badge variant="secondary" className="text-xs">
                  Test
                </Badge>
              )}
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">No site selected</span>
        </SelectItem>
        {sites.length === 0 ? (
          <div className="py-4 px-2 text-center text-sm text-muted-foreground">
            No sites available
          </div>
        ) : (
          sites.map((site) => (
            <SelectItem key={site.id} value={site.id}>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="font-medium">{site.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {site.agencyName} • {site.slug}
                  </span>
                </div>
                {site.isTestSite && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Test Site
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
