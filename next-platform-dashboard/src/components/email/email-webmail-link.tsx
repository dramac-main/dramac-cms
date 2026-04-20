import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface EmailWebmailLinkProps {
  domain: string;
}

export function EmailWebmailLink({ domain }: EmailWebmailLinkProps) {
  const webmailUrl = domain
    ? `https://app.titan.email/?domain=${encodeURIComponent(domain)}`
    : "https://app.titan.email";

  return (
    <Button variant="outline" asChild>
      <a
        href={webmailUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={domain ? `Open webmail for ${domain}` : "Open webmail"}
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        Open Webmail
      </a>
    </Button>
  );
}
