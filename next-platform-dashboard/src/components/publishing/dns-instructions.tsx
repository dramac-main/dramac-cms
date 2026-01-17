"use client";

import { Check, X, Copy, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { DnsRecord } from "@/lib/publishing/domain-service";
import { toast } from "sonner";

interface DnsInstructionsProps {
  domain: string;
  records: DnsRecord[];
}

export function DnsInstructions({ domain, records }: DnsInstructionsProps) {
  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Add these DNS records at your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
        </AlertDescription>
      </Alert>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Type</TableHead>
            <TableHead className="w-32">Name/Host</TableHead>
            <TableHead>Value/Points to</TableHead>
            <TableHead className="w-24 text-center">Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record, i) => (
            <TableRow key={i}>
              <TableCell>
                <Badge variant="outline">{record.type}</Badge>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {record.name === "@" ? domain : `${record.name}.${domain}`}
              </TableCell>
              <TableCell className="font-mono text-sm max-w-xs truncate">
                {record.value}
              </TableCell>
              <TableCell className="text-center">
                {record.verified ? (
                  <Check className="h-4 w-4 text-green-500 mx-auto" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground mx-auto" />
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyValue(record.value)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• DNS changes can take 24-48 hours to propagate worldwide</p>
        <p>• The TXT record is required for domain verification</p>
        <p>• SSL certificate will be automatically provisioned after verification</p>
      </div>
    </div>
  );
}
