"use client";

import { useState, useTransition } from "react";
import { Plus, RefreshCw, Globe, Mail, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { syncDnsRecords, createDnsRecord, setupEmailDns, setupSiteDns } from "@/lib/actions/dns";

interface DnsActionsProps {
  domainId: string;
  domainName: string;
}

export function DnsActions({ domainId, domainName }: DnsActionsProps) {
  const [isSyncing, startSyncTransition] = useTransition();
  const [addRecordOpen, setAddRecordOpen] = useState(false);
  const [recordType, setRecordType] = useState("A");
  const [recordName, setRecordName] = useState("");
  const [recordValue, setRecordValue] = useState("");
  const [recordTtl, setRecordTtl] = useState("3600");
  const [recordPriority, setRecordPriority] = useState("10");
  const [recordProxied, setRecordProxied] = useState(false);
  const [isAdding, startAddTransition] = useTransition();

  const handleSync = () => {
    startSyncTransition(async () => {
      const result = await syncDnsRecords(domainId);
      if (result.success && result.data) {
        const { synced, added, removed } = result.data;
        toast.success("DNS records synced", {
          description: `${synced} records synced (${added} added, ${removed} removed)`,
        });
      } else {
        toast.error(result.error || "Failed to sync DNS records");
      }
    });
  };

  const handleAddRecord = () => {
    if (!recordName || !recordValue) {
      toast.error("Please fill in all required fields");
      return;
    }

    startAddTransition(async () => {
      const result = await createDnsRecord(domainId, {
        type: recordType as 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV',
        name: recordName,
        content: recordValue,
        ttl: parseInt(recordTtl) || 3600,
        priority: recordType === 'MX' ? parseInt(recordPriority) || 10 : undefined,
        proxied: ['A', 'AAAA', 'CNAME'].includes(recordType) ? recordProxied : false,
      });

      if (result.success) {
        toast.success("DNS record added", {
          description: `Added ${recordType} record for ${recordName === '@' ? domainName : `${recordName}.${domainName}`}`,
        });
        setAddRecordOpen(false);
        setRecordName("");
        setRecordValue("");
        setRecordTtl("3600");
        setRecordPriority("10");
        setRecordProxied(false);
      } else {
        toast.error(result.error || "Failed to add DNS record");
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync'}
        </Button>
        <Button size="sm" onClick={() => setAddRecordOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Record
        </Button>
      </div>

      <Dialog open={addRecordOpen} onOpenChange={setAddRecordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add DNS Record</DialogTitle>
            <DialogDescription>
              Add a new DNS record for {domainName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Record Type</Label>
              <Select value={recordType} onValueChange={setRecordType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A (IPv4 Address)</SelectItem>
                  <SelectItem value="AAAA">AAAA (IPv6 Address)</SelectItem>
                  <SelectItem value="CNAME">CNAME (Alias)</SelectItem>
                  <SelectItem value="MX">MX (Mail Exchange)</SelectItem>
                  <SelectItem value="TXT">TXT (Text Record)</SelectItem>
                  <SelectItem value="NS">NS (Name Server)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Name</Label>
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="@ or subdomain" 
                  value={recordName}
                  onChange={(e) => setRecordName(e.target.value)}
                />
                <span className="text-sm text-muted-foreground">.{domainName}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Value</Label>
              <Input 
                placeholder={
                  recordType === 'A' ? '192.0.2.1' : 
                  recordType === 'AAAA' ? '2001:db8::1' :
                  recordType === 'CNAME' ? 'target.example.com' : 
                  recordType === 'MX' ? 'mail.example.com' : 
                  recordType === 'TXT' ? 'v=spf1 include:...' :
                  'value'
                }
                value={recordValue}
                onChange={(e) => setRecordValue(e.target.value)}
              />
            </div>

            {recordType === 'MX' && (
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input 
                  type="number"
                  placeholder="10"
                  value={recordPriority}
                  onChange={(e) => setRecordPriority(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>TTL (seconds)</Label>
              <Select value={recordTtl} onValueChange={setRecordTtl}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Auto</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                  <SelectItem value="3600">1 hour</SelectItem>
                  <SelectItem value="18000">5 hours</SelectItem>
                  <SelectItem value="86400">1 day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {['A', 'AAAA', 'CNAME'].includes(recordType) && (
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="proxied"
                  checked={recordProxied}
                  onChange={(e) => setRecordProxied(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="proxied" className="text-sm">
                  Proxy through Cloudflare (orange cloud)
                </Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRecordOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRecord} disabled={isAdding}>
              {isAdding ? 'Adding...' : 'Add Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface DnsQuickTemplatesProps {
  domainId: string;
  domainName: string;
}

export function DnsQuickTemplates({ domainId, domainName }: DnsQuickTemplatesProps) {
  const [isApplying, setIsApplying] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const applyTemplate = (template: string) => {
    setIsApplying(template);
    
    startTransition(async () => {
      let result;
      
      switch (template) {
        case 'website':
          result = await setupSiteDns(domainId);
          break;
        case 'titan':
          result = await setupEmailDns(domainId);
          break;
        default:
          result = await syncDnsRecords(domainId);
          break;
      }

      setIsApplying(null);

      const templateNames: Record<string, string> = {
        website: "Website",
        titan: "Titan Email",
        google: "Google Workspace",
        security: "Security (SPF/DKIM)",
      };

      if (result.success) {
        toast.success(`${templateNames[template]} template applied`, {
          description: `DNS records for ${templateNames[template]} have been configured for ${domainName}`,
        });
      } else {
        toast.error(result.error || `Failed to apply ${templateNames[template]} template`);
      }
    });
  };

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <Button 
        variant="outline" 
        className="h-auto flex-col py-3"
        onClick={() => applyTemplate('website')}
        disabled={isPending}
      >
        <Globe className={`h-5 w-5 mb-1 ${isApplying === 'website' ? 'animate-pulse' : ''}`} />
        <span className="text-xs">{isApplying === 'website' ? 'Applying...' : 'Website'}</span>
      </Button>
      <Button 
        variant="outline" 
        className="h-auto flex-col py-3"
        onClick={() => applyTemplate('titan')}
        disabled={isPending}
      >
        <Mail className={`h-5 w-5 mb-1 ${isApplying === 'titan' ? 'animate-pulse' : ''}`} />
        <span className="text-xs">{isApplying === 'titan' ? 'Applying...' : 'Titan Email'}</span>
      </Button>
      <Button 
        variant="outline" 
        className="h-auto flex-col py-3"
        onClick={() => applyTemplate('google')}
        disabled={isPending}
      >
        <FileText className={`h-5 w-5 mb-1 ${isApplying === 'google' ? 'animate-pulse' : ''}`} />
        <span className="text-xs">{isApplying === 'google' ? 'Applying...' : 'Google Workspace'}</span>
      </Button>
      <Button 
        variant="outline" 
        className="h-auto flex-col py-3"
        onClick={() => applyTemplate('security')}
        disabled={isPending}
      >
        <Shield className={`h-5 w-5 mb-1 ${isApplying === 'security' ? 'animate-pulse' : ''}`} />
        <span className="text-xs">{isApplying === 'security' ? 'Applying...' : 'Security (SPF/DKIM)'}</span>
      </Button>
    </div>
  );
}

interface DnsRecordActionsProps {
  recordId: string;
  recordType: string;
  recordName: string;
  domainId: string;
  domainName: string;
}

export function DnsRecordActions({ recordId, recordType, recordName, domainId, domainName }: DnsRecordActionsProps) {
  return (
    <Button variant="ghost" size="sm" disabled>
      Edit
    </Button>
  );
}
