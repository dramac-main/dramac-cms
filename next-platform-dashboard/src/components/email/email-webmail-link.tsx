import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface EmailWebmailLinkProps {
  domain: string;
}

export function EmailWebmailLink({ domain }: EmailWebmailLinkProps) {
  return (
    <Button variant="outline" asChild>
      <a 
        href="https://mail.titan.email" 
        target="_blank" 
        rel="noopener noreferrer"
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        Open Webmail
      </a>
    </Button>
  );
}
