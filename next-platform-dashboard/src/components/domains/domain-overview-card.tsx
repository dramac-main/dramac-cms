"use client";

import Link from "next/link";
import { 
  Globe, 
  ExternalLink, 
  RefreshCw, 
  Shield, 
  Mail,
  Server
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DomainStatusBadge } from "./domain-status-badge";
import { DomainExpiryBadge } from "./domain-expiry-badge";
import { DomainQuickActions } from "./domain-quick-actions";
import type { DomainWithDetails } from "@/types/domain";

interface DomainOverviewCardProps {
  domain: DomainWithDetails;
  onRenew?: () => void;
}

export function DomainOverviewCard({ domain, onRenew }: DomainOverviewCardProps) {
  return (
    <Card className="group hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link 
                  href={`/dashboard/domains/${domain.id}`}
                  className="font-semibold hover:underline"
                >
                  {domain.domain_name}
                </Link>
                <a 
                  href={`https://${domain.domain_name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-xs text-muted-foreground">
                {domain.tld} • Registered via ResellerClub
              </p>
            </div>
          </div>
          
          <DomainQuickActions 
            domainId={domain.id}
            domainName={domain.domain_name}
            isLocked={domain.transfer_lock}
            onRenew={onRenew}
          />
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <DomainStatusBadge status={domain.status} />
          <DomainExpiryBadge expiryDate={domain.expiry_date} />
          
          {domain.auto_renew && (
            <Badge variant="outline" className="gap-1 text-xs">
              <RefreshCw className="h-3 w-3" />
              Auto-Renew
            </Badge>
          )}
          
          {domain.whois_privacy && (
            <Badge variant="outline" className="gap-1 text-xs bg-blue-500/10 text-blue-600 border-blue-200">
              <Shield className="h-3 w-3" />
              Privacy
            </Badge>
          )}
          
          {domain.cloudflare_zone_id && (
            <Badge variant="outline" className="gap-1 text-xs bg-orange-500/10 text-orange-600 border-orange-200">
              <Server className="h-3 w-3" />
              Cloudflare
            </Badge>
          )}
        </div>
        
        {/* Assignments */}
        {(domain.client || domain.site) && (
          <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs text-muted-foreground">
            {domain.client && (
              <span>
                Client: <span className="text-foreground">{domain.client.company || domain.client.name}</span>
              </span>
            )}
            {domain.site && (
              <span>
                Site: <span className="text-foreground">{domain.site.name}</span>
              </span>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 gap-2">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link href={`/dashboard/domains/${domain.id}`}>
            Manage
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/domains/${domain.id}/dns`}>
            <Server className="h-3 w-3 mr-1" />
            DNS
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/domains/${domain.id}/email`}>
            <Mail className="h-3 w-3 mr-1" />
            Email
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
