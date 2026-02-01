import { AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDomains } from "@/lib/actions/domains";
import { formatDistanceToNow } from "date-fns";

export async function ExpiringDomainsWidget() {
  const { data: domains } = await getDomains({
    expiringWithinDays: 30,
    limit: 5,
  });
  
  if (!domains || domains.length === 0) return null;
  
  // Categorize by urgency
  const urgent = domains.filter(d => {
    if (!d.expiry_date) return false;
    const daysUntil = Math.ceil((new Date(d.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7;
  });
  
  const warning = domains.filter(d => {
    if (!d.expiry_date) return false;
    const daysUntil = Math.ceil((new Date(d.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil > 7 && daysUntil <= 30;
  });
  
  const isUrgent = urgent.length > 0;
  
  return (
    <Alert variant={isUrgent ? "destructive" : "default"} className="border-l-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>Domains Expiring Soon</span>
        <div className="flex items-center gap-2">
          {urgent.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {urgent.length} urgent
            </Badge>
          )}
          {warning.length > 0 && (
            <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-200">
              {warning.length} warning
            </Badge>
          )}
        </div>
      </AlertTitle>
      <AlertDescription>
        <div className="mt-3 space-y-2">
          {domains.slice(0, 3).map((domain) => (
            <div 
              key={domain.id}
              className="flex items-center justify-between p-2 rounded bg-background/50"
            >
              <div>
                <p className="font-medium text-sm">{domain.domain_name}</p>
                <p className="text-xs text-muted-foreground">
                  Expires {domain.expiry_date 
                    ? formatDistanceToNow(new Date(domain.expiry_date), { addSuffix: true })
                    : 'soon'}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/domains/${domain.id}`}>
                  Renew
                </Link>
              </Button>
            </div>
          ))}
        </div>
        
        {domains.length > 3 && (
          <Button variant="link" size="sm" className="mt-2 p-0 h-auto" asChild>
            <Link href="/dashboard/domains?filter=expiring">
              View all {domains.length} expiring domains
              <ChevronRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
