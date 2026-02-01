"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TLD_INFO: Record<string, { description: string; popular?: boolean; new?: boolean }> = {
  '.com': { description: 'Commercial - Most popular', popular: true },
  '.net': { description: 'Network - Tech businesses', popular: true },
  '.org': { description: 'Organization - Non-profits', popular: true },
  '.io': { description: 'Tech startups', popular: true },
  '.co': { description: 'Company/Colombia', popular: true },
  '.app': { description: 'Applications', new: true },
  '.dev': { description: 'Developers', new: true },
  '.ai': { description: 'Artificial Intelligence', new: true },
  '.me': { description: 'Personal branding' },
  '.info': { description: 'Information sites' },
  '.biz': { description: 'Business' },
  '.tech': { description: 'Technology', new: true },
  '.online': { description: 'Online presence', new: true },
  '.store': { description: 'E-commerce', new: true },
  '.shop': { description: 'Retail shops', new: true },
  '.blog': { description: 'Blogs', new: true },
  '.site': { description: 'Websites', new: true },
};

interface DomainSuggestionsProps {
  keyword: string;
  selectedTlds: string[];
  onToggleTld: (tld: string) => void;
  className?: string;
}

export function DomainSuggestions({
  keyword,
  selectedTlds,
  onToggleTld,
  className,
}: DomainSuggestionsProps) {
  const tlds = Object.entries(TLD_INFO);

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-sm font-medium mb-2">Popular Extensions</h3>
        <div className="flex flex-wrap gap-2">
          {tlds
            .filter(([, info]) => info.popular)
            .map(([tld, info]) => (
              <Badge
                key={tld}
                variant={selectedTlds.includes(tld) ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-colors",
                  selectedTlds.includes(tld) && "bg-primary"
                )}
                onClick={() => onToggleTld(tld)}
                title={info.description}
              >
                {keyword}{tld}
              </Badge>
            ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">New Extensions</h3>
        <div className="flex flex-wrap gap-2">
          {tlds
            .filter(([, info]) => info.new)
            .map(([tld, info]) => (
              <Badge
                key={tld}
                variant={selectedTlds.includes(tld) ? "default" : "outline"}
                className="cursor-pointer transition-colors"
                onClick={() => onToggleTld(tld)}
                title={info.description}
              >
                {keyword}{tld}
              </Badge>
            ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Other Extensions</h3>
        <div className="flex flex-wrap gap-2">
          {tlds
            .filter(([, info]) => !info.popular && !info.new)
            .map(([tld, info]) => (
              <Badge
                key={tld}
                variant={selectedTlds.includes(tld) ? "default" : "outline"}
                className="cursor-pointer transition-colors"
                onClick={() => onToggleTld(tld)}
                title={info.description}
              >
                {keyword}{tld}
              </Badge>
            ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Click on an extension to toggle it in your search. Selected extensions will be checked for availability.
      </p>
    </div>
  );
}
