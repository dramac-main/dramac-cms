"use client";

import { format } from "date-fns";
import { 
  Calendar, 
  Clock, 
  Globe, 
  Server, 
  Shield, 
  User,
  Building,
  Link as LinkIcon
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { DomainWithDetails } from "@/types/domain";

interface DomainInfoCardProps {
  domain: DomainWithDetails;
}

export function DomainInfoCard({ domain }: DomainInfoCardProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return format(new Date(dateStr), 'MMM dd, yyyy');
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Domain Information
        </CardTitle>
        <CardDescription>
          Registration and configuration details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Registration Info */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Registered</p>
              <p className="font-medium">{formatDate(domain.registration_date)}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expires</p>
              <p className="font-medium">{formatDate(domain.expiry_date)}</p>
            </div>
          </div>
          
          {domain.last_renewed_at && (
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Renewed</p>
                <p className="font-medium">{formatDate(domain.last_renewed_at)}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">WHOIS Privacy</p>
              <p className="font-medium">{domain.whois_privacy ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Technical Info */}
        <div>
          <h4 className="text-sm font-medium mb-3">Technical Details</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">TLD</span>
              <span className="font-mono">{domain.tld}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">SLD</span>
              <span className="font-mono">{domain.sld}</span>
            </div>
            {domain.resellerclub_order_id && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-mono text-xs">{domain.resellerclub_order_id}</span>
              </div>
            )}
            {domain.cloudflare_zone_id && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cloudflare Zone</span>
                <span className="font-mono text-xs">{domain.cloudflare_zone_id.slice(0, 12)}...</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Assignments */}
        {(domain.client || domain.site) && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-3">Assignments</h4>
              <div className="space-y-3">
                {domain.client && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                      <Building className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{domain.client.company || domain.client.name}</p>
                      <p className="text-xs text-muted-foreground">Client</p>
                    </div>
                  </div>
                )}
                {domain.site && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{domain.site.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {domain.site.subdomain}.dramac.app
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
