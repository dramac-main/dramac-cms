"use client";

import { useState } from "react";
import { Plus, RefreshCw, Globe, Mail, FileText, Shield, Trash2, Edit } from "lucide-react";
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

interface DnsActionsProps {
  domainName: string;
}

export function DnsActions({ domainName }: DnsActionsProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [addRecordOpen, setAddRecordOpen] = useState(false);
  const [recordType, setRecordType] = useState("A");
  const [recordName, setRecordName] = useState("");
  const [recordValue, setRecordValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSyncing(false);
    toast.success("DNS records synced successfully", {
      description: `Synced records for ${domainName}`,
    });
  };

  const handleAddRecord = async () => {
    if (!recordName || !recordValue) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsAdding(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsAdding(false);
    setAddRecordOpen(false);
    setRecordName("");
    setRecordValue("");
    
    toast.success("DNS record added", {
      description: `Added ${recordType} record for ${recordName}.${domainName}`,
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
                placeholder={recordType === 'A' ? '192.0.2.1' : recordType === 'CNAME' ? 'target.example.com' : 'value'}
                value={recordValue}
                onChange={(e) => setRecordValue(e.target.value)}
              />
            </div>
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
  domainName: string;
}

export function DnsQuickTemplates({ domainName }: DnsQuickTemplatesProps) {
  const [isApplying, setIsApplying] = useState<string | null>(null);

  const applyTemplate = async (template: string) => {
    setIsApplying(template);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsApplying(null);
    
    const templateNames: Record<string, string> = {
      website: "Website",
      titan: "Titan Email",
      google: "Google Workspace",
      security: "Security (SPF/DKIM)",
    };

    toast.success(`${templateNames[template]} template applied`, {
      description: `DNS records for ${templateNames[template]} have been configured for ${domainName}`,
    });
  };

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <Button 
        variant="outline" 
        className="h-auto flex-col py-3"
        onClick={() => applyTemplate('website')}
        disabled={isApplying !== null}
      >
        <Globe className={`h-5 w-5 mb-1 ${isApplying === 'website' ? 'animate-pulse' : ''}`} />
        <span className="text-xs">{isApplying === 'website' ? 'Applying...' : 'Website'}</span>
      </Button>
      <Button 
        variant="outline" 
        className="h-auto flex-col py-3"
        onClick={() => applyTemplate('titan')}
        disabled={isApplying !== null}
      >
        <Mail className={`h-5 w-5 mb-1 ${isApplying === 'titan' ? 'animate-pulse' : ''}`} />
        <span className="text-xs">{isApplying === 'titan' ? 'Applying...' : 'Titan Email'}</span>
      </Button>
      <Button 
        variant="outline" 
        className="h-auto flex-col py-3"
        onClick={() => applyTemplate('google')}
        disabled={isApplying !== null}
      >
        <FileText className={`h-5 w-5 mb-1 ${isApplying === 'google' ? 'animate-pulse' : ''}`} />
        <span className="text-xs">{isApplying === 'google' ? 'Applying...' : 'Google Workspace'}</span>
      </Button>
      <Button 
        variant="outline" 
        className="h-auto flex-col py-3"
        onClick={() => applyTemplate('security')}
        disabled={isApplying !== null}
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
  domainName: string;
}

export function DnsRecordActions({ recordId, recordType, recordName, domainName }: DnsRecordActionsProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    toast.info("Edit DNS Record", {
      description: `Editing ${recordType} record for ${recordName === '@' ? domainName : `${recordName}.${domainName}`}`,
    });
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleEdit}>
      Edit
    </Button>
  );
}
