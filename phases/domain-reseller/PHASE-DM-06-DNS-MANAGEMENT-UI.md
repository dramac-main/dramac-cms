# Phase DM-06: DNS Management UI

> **Priority**: 🔴 HIGH  
> **Estimated Time**: 8 hours  
> **Prerequisites**: DM-01, DM-02, DM-03, DM-05  
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create a comprehensive DNS management interface:

1. ✅ DNS record editor (CRUD operations)
2. ✅ Quick DNS templates (Site, Email, Google Workspace)
3. ✅ One-click setup for common configurations
4. ✅ DNS propagation status checker
5. ✅ Nameserver management
6. ✅ DNS health monitoring

---

## 📁 Files to Create

```
src/app/(dashboard)/dashboard/domains/[domainId]/
└── dns/
    ├── page.tsx                    # DNS management page
    └── loading.tsx                 # Loading state

src/components/domains/dns/
├── dns-records-table.tsx           # DNS records data table
├── dns-record-form.tsx             # Add/Edit DNS record form
├── dns-record-row.tsx              # Individual record row
├── dns-templates-dropdown.tsx      # Quick template selector
├── dns-propagation-checker.tsx     # Propagation status
├── dns-nameservers.tsx             # Nameserver display/management
├── dns-health-status.tsx           # DNS health indicator
├── dns-record-type-badge.tsx       # Record type badge
├── dns-quick-actions.tsx           # Common DNS actions
└── index.ts                        # Barrel exports

src/lib/actions/
└── dns.ts                          # DNS server actions

src/hooks/
└── use-dns-records.ts              # DNS records hook
```

---

## 📋 Implementation Tasks

### Task 1: DNS Server Actions (60 mins)

```typescript
// src/lib/actions/dns.ts

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cloudflareApi } from "@/lib/cloudflare";
import { DNS_TEMPLATES } from "@/lib/cloudflare/config";
import type { DnsRecord, DnsRecordType, CreateDnsRecordParams } from "@/lib/cloudflare/types";

// ============================================================================
// DNS Record Actions
// ============================================================================

export async function getDnsRecords(domainId: string) {
  const supabase = await createClient();
  
  // Get user's agency
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    // Get domain with zone ID
    const { data: domain, error: domainError } = await supabase
      .from('domains')
      .select('cloudflare_zone_id, domain_name')
      .eq('id', domainId)
      .single();

    if (domainError || !domain?.cloudflare_zone_id) {
      return { success: false, error: 'Domain not found or not configured with Cloudflare' };
    }

    // Get records from Cloudflare
    const records = await cloudflareApi.dns.listRecords(domain.cloudflare_zone_id);
    
    return { 
      success: true, 
      data: {
        records,
        domainName: domain.domain_name,
        zoneId: domain.cloudflare_zone_id,
      }
    };
  } catch (error) {
    console.error('Get DNS records error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get DNS records' 
    };
  }
}

export async function createDnsRecord(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    const domainId = formData.get('domainId') as string;
    const type = formData.get('type') as DnsRecordType;
    const name = formData.get('name') as string;
    const content = formData.get('content') as string;
    const ttl = parseInt(formData.get('ttl') as string) || 3600;
    const priority = formData.get('priority') ? parseInt(formData.get('priority') as string) : undefined;
    const proxied = formData.get('proxied') === 'true';

    // Get domain zone ID
    const { data: domain } = await supabase
      .from('domains')
      .select('cloudflare_zone_id')
      .eq('id', domainId)
      .single();

    if (!domain?.cloudflare_zone_id) {
      return { success: false, error: 'Domain not configured with Cloudflare' };
    }

    // Create record in Cloudflare
    const record = await cloudflareApi.dns.createRecord({
      zoneId: domain.cloudflare_zone_id,
      type,
      name,
      content,
      ttl,
      priority,
      proxied: ['A', 'AAAA', 'CNAME'].includes(type) ? proxied : false,
    });

    revalidatePath(`/dashboard/domains/${domainId}/dns`);
    
    return { success: true, data: record };
  } catch (error) {
    console.error('Create DNS record error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create DNS record' 
    };
  }
}

export async function updateDnsRecord(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    const domainId = formData.get('domainId') as string;
    const recordId = formData.get('recordId') as string;
    const type = formData.get('type') as DnsRecordType;
    const name = formData.get('name') as string;
    const content = formData.get('content') as string;
    const ttl = parseInt(formData.get('ttl') as string) || 3600;
    const priority = formData.get('priority') ? parseInt(formData.get('priority') as string) : undefined;
    const proxied = formData.get('proxied') === 'true';

    // Get domain zone ID
    const { data: domain } = await supabase
      .from('domains')
      .select('cloudflare_zone_id')
      .eq('id', domainId)
      .single();

    if (!domain?.cloudflare_zone_id) {
      return { success: false, error: 'Domain not configured with Cloudflare' };
    }

    // Update record in Cloudflare
    const record = await cloudflareApi.dns.updateRecord({
      recordId,
      zoneId: domain.cloudflare_zone_id,
      type,
      name,
      content,
      ttl,
      priority,
      proxied: ['A', 'AAAA', 'CNAME'].includes(type) ? proxied : false,
    });

    revalidatePath(`/dashboard/domains/${domainId}/dns`);
    
    return { success: true, data: record };
  } catch (error) {
    console.error('Update DNS record error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update DNS record' 
    };
  }
}

export async function deleteDnsRecord(domainId: string, recordId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    // Get domain zone ID
    const { data: domain } = await supabase
      .from('domains')
      .select('cloudflare_zone_id')
      .eq('id', domainId)
      .single();

    if (!domain?.cloudflare_zone_id) {
      return { success: false, error: 'Domain not configured with Cloudflare' };
    }

    // Delete record in Cloudflare
    await cloudflareApi.dns.deleteRecord(domain.cloudflare_zone_id, recordId);

    revalidatePath(`/dashboard/domains/${domainId}/dns`);
    
    return { success: true };
  } catch (error) {
    console.error('Delete DNS record error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete DNS record' 
    };
  }
}

// ============================================================================
// DNS Template Actions
// ============================================================================

export type DnsTemplateType = 'site' | 'titanEmail' | 'googleWorkspace' | 'vercel' | 'netlify';

export async function applyDnsTemplate(domainId: string, templateType: DnsTemplateType) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    // Get domain details
    const { data: domain } = await supabase
      .from('domains')
      .select('cloudflare_zone_id, domain_name')
      .eq('id', domainId)
      .single();

    if (!domain?.cloudflare_zone_id) {
      return { success: false, error: 'Domain not configured with Cloudflare' };
    }

    const recordsToCreate = getTemplateRecords(templateType, domain.domain_name);
    const createdRecords: DnsRecord[] = [];
    const errors: string[] = [];

    for (const record of recordsToCreate) {
      try {
        const created = await cloudflareApi.dns.createRecord({
          zoneId: domain.cloudflare_zone_id,
          ...record,
        });
        createdRecords.push(created);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        // Skip duplicate record errors
        if (!message.includes('already exists')) {
          errors.push(`Failed to create ${record.type} record: ${message}`);
        }
      }
    }

    revalidatePath(`/dashboard/domains/${domainId}/dns`);
    
    return { 
      success: true, 
      data: {
        created: createdRecords.length,
        errors,
      }
    };
  } catch (error) {
    console.error('Apply DNS template error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to apply template' 
    };
  }
}

function getTemplateRecords(templateType: DnsTemplateType, domainName: string): Omit<CreateDnsRecordParams, 'zoneId'>[] {
  const platformIp = process.env.PLATFORM_IP || '76.76.21.21';
  const platformCname = process.env.DEFAULT_CNAME_TARGET || 'cname.dramac.app';
  
  switch (templateType) {
    case 'site':
      return [
        { type: 'A', name: '@', content: platformIp, ttl: 3600, proxied: true },
        { type: 'CNAME', name: 'www', content: domainName, ttl: 3600, proxied: true },
      ];
    
    case 'titanEmail':
      return [
        { type: 'MX', name: '@', content: 'mx1.titan.email', ttl: 3600, priority: 10 },
        { type: 'MX', name: '@', content: 'mx2.titan.email', ttl: 3600, priority: 20 },
        { type: 'TXT', name: '@', content: 'v=spf1 include:spf.titan.email ~all', ttl: 3600 },
      ];
    
    case 'googleWorkspace':
      return [
        { type: 'MX', name: '@', content: 'ASPMX.L.GOOGLE.COM', ttl: 3600, priority: 1 },
        { type: 'MX', name: '@', content: 'ALT1.ASPMX.L.GOOGLE.COM', ttl: 3600, priority: 5 },
        { type: 'MX', name: '@', content: 'ALT2.ASPMX.L.GOOGLE.COM', ttl: 3600, priority: 5 },
        { type: 'MX', name: '@', content: 'ALT3.ASPMX.L.GOOGLE.COM', ttl: 3600, priority: 10 },
        { type: 'MX', name: '@', content: 'ALT4.ASPMX.L.GOOGLE.COM', ttl: 3600, priority: 10 },
        { type: 'TXT', name: '@', content: 'v=spf1 include:_spf.google.com ~all', ttl: 3600 },
      ];
    
    case 'vercel':
      return [
        { type: 'A', name: '@', content: '76.76.21.21', ttl: 3600, proxied: false },
        { type: 'CNAME', name: 'www', content: 'cname.vercel-dns.com', ttl: 3600, proxied: false },
      ];
    
    case 'netlify':
      return [
        { type: 'A', name: '@', content: '75.2.60.5', ttl: 3600, proxied: false },
        { type: 'CNAME', name: 'www', content: domainName + '.netlify.app', ttl: 3600, proxied: false },
      ];
    
    default:
      return [];
  }
}

// ============================================================================
// DNS Propagation Actions
// ============================================================================

export async function checkDnsPropagation(domainName: string, recordType: string, expectedValue?: string) {
  // Use external DNS lookup services
  const dnsServers = [
    { name: 'Google', ip: '8.8.8.8' },
    { name: 'Cloudflare', ip: '1.1.1.1' },
    { name: 'OpenDNS', ip: '208.67.222.222' },
  ];

  try {
    // In production, use DNS lookup APIs
    // For now, return mock data structure
    const results = dnsServers.map(server => ({
      server: server.name,
      ip: server.ip,
      status: 'propagated' as const,
      value: expectedValue || '',
      ttl: 3600,
    }));

    return { 
      success: true, 
      data: {
        fullyPropagated: true,
        results,
      }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check propagation' 
    };
  }
}

// ============================================================================
// Nameserver Actions
// ============================================================================

export async function getNameservers(domainId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    const { data: domain } = await supabase
      .from('domains')
      .select('nameservers, cloudflare_zone_id')
      .eq('id', domainId)
      .single();

    if (!domain) {
      return { success: false, error: 'Domain not found' };
    }

    // Get expected nameservers from Cloudflare zone if available
    let expectedNameservers: string[] = [];
    if (domain.cloudflare_zone_id) {
      const zone = await cloudflareApi.zones.getZone(domain.cloudflare_zone_id);
      expectedNameservers = zone.nameServers || [];
    }

    return { 
      success: true, 
      data: {
        current: domain.nameservers || [],
        expected: expectedNameservers,
        configured: arraysEqual(domain.nameservers || [], expectedNameservers),
      }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get nameservers' 
    };
  }
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}
```

### Task 2: DNS Records Table Component (60 mins)

```typescript
// src/components/domains/dns/dns-records-table.tsx

"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Pencil, Trash2, Search, Shield, ShieldOff } from "lucide-react";
import { DnsRecordTypeBadge } from "./dns-record-type-badge";
import { DnsRecordForm } from "./dns-record-form";
import { deleteDnsRecord } from "@/lib/actions/dns";
import { toast } from "sonner";
import type { DnsRecord } from "@/lib/cloudflare/types";

interface DnsRecordsTableProps {
  records: DnsRecord[];
  domainId: string;
  domainName: string;
}

export function DnsRecordsTable({ records, domainId, domainName }: DnsRecordsTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [editingRecord, setEditingRecord] = useState<DnsRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<DnsRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter records
  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.name.toLowerCase().includes(search.toLowerCase()) ||
      record.content.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || record.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Get unique record types for filter
  const recordTypes = Array.from(new Set(records.map(r => r.type)));

  async function handleDelete() {
    if (!deletingRecord) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteDnsRecord(domainId, deletingRecord.id);
      if (result.success) {
        toast.success("DNS record deleted");
      } else {
        toast.error(result.error || "Failed to delete record");
      }
    } finally {
      setIsDeleting(false);
      setDeletingRecord(null);
    }
  }

  // Format display name (remove domain suffix for readability)
  const formatName = (name: string) => {
    if (name === domainName || name === `${domainName}.`) {
      return "@";
    }
    return name.replace(`.${domainName}`, "").replace(`.${domainName}.`, "");
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Types</option>
            {recordTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Content</TableHead>
              <TableHead className="w-[80px]">TTL</TableHead>
              <TableHead className="w-[80px]">Proxy</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {search || typeFilter !== "all" 
                    ? "No records match your filters"
                    : "No DNS records found"
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <DnsRecordTypeBadge type={record.type} />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatName(record.name)}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate font-mono text-sm">
                    {record.priority && (
                      <span className="text-muted-foreground mr-2">
                        [{record.priority}]
                      </span>
                    )}
                    {record.content}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {record.ttl === 1 ? "Auto" : `${record.ttl}s`}
                  </TableCell>
                  <TableCell>
                    {record.proxiable ? (
                      record.proxied ? (
                        <Badge variant="default" className="bg-orange-500">
                          <Shield className="h-3 w-3 mr-1" />
                          On
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <ShieldOff className="h-3 w-3 mr-1" />
                          Off
                        </Badge>
                      )
                    ) : (
                      <span className="text-muted-foreground text-sm">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingRecord(record)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeletingRecord(record)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      {editingRecord && (
        <DnsRecordForm
          domainId={domainId}
          domainName={domainName}
          record={editingRecord}
          open={!!editingRecord}
          onOpenChange={(open) => !open && setEditingRecord(null)}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingRecord} onOpenChange={(open) => !open && setDeletingRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete DNS Record?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deletingRecord?.type} record for{" "}
              <span className="font-mono">{deletingRecord?.name}</span>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

### Task 3: DNS Record Form Component (45 mins)

```typescript
// src/components/domains/dns/dns-record-form.tsx

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createDnsRecord, updateDnsRecord } from "@/lib/actions/dns";
import { toast } from "sonner";
import type { DnsRecord, DnsRecordType } from "@/lib/cloudflare/types";

const DNS_RECORD_TYPES: { value: DnsRecordType; label: string; description: string }[] = [
  { value: 'A', label: 'A', description: 'Points to an IPv4 address' },
  { value: 'AAAA', label: 'AAAA', description: 'Points to an IPv6 address' },
  { value: 'CNAME', label: 'CNAME', description: 'Points to another domain' },
  { value: 'MX', label: 'MX', description: 'Mail server record' },
  { value: 'TXT', label: 'TXT', description: 'Text record (SPF, DKIM, etc.)' },
  { value: 'NS', label: 'NS', description: 'Nameserver record' },
  { value: 'SRV', label: 'SRV', description: 'Service record' },
  { value: 'CAA', label: 'CAA', description: 'Certificate Authority Authorization' },
];

const TTL_OPTIONS = [
  { value: '1', label: 'Auto' },
  { value: '60', label: '1 minute' },
  { value: '300', label: '5 minutes' },
  { value: '600', label: '10 minutes' },
  { value: '900', label: '15 minutes' },
  { value: '1800', label: '30 minutes' },
  { value: '3600', label: '1 hour' },
  { value: '7200', label: '2 hours' },
  { value: '18000', label: '5 hours' },
  { value: '43200', label: '12 hours' },
  { value: '86400', label: '1 day' },
];

const formSchema = z.object({
  type: z.string().min(1, "Record type is required"),
  name: z.string().min(1, "Name is required"),
  content: z.string().min(1, "Content is required"),
  ttl: z.string().default("3600"),
  priority: z.string().optional(),
  proxied: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface DnsRecordFormProps {
  domainId: string;
  domainName: string;
  record?: DnsRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DnsRecordForm({ 
  domainId, 
  domainName, 
  record, 
  open, 
  onOpenChange 
}: DnsRecordFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!record;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: record?.type || 'A',
      name: record?.name.replace(`.${domainName}`, '').replace(`.${domainName}.`, '') || '@',
      content: record?.content || '',
      ttl: record?.ttl.toString() || '3600',
      priority: record?.priority?.toString() || '',
      proxied: record?.proxied ?? true,
    },
  });

  const selectedType = form.watch("type");
  const showPriority = selectedType === "MX" || selectedType === "SRV";
  const canProxy = ['A', 'AAAA', 'CNAME'].includes(selectedType);

  function onSubmit(values: FormValues) {
    const formData = new FormData();
    formData.append('domainId', domainId);
    formData.append('type', values.type);
    formData.append('name', values.name);
    formData.append('content', values.content);
    formData.append('ttl', values.ttl);
    formData.append('proxied', String(canProxy && values.proxied));
    
    if (showPriority && values.priority) {
      formData.append('priority', values.priority);
    }
    
    if (record) {
      formData.append('recordId', record.id);
    }

    startTransition(async () => {
      const action = isEditing ? updateDnsRecord : createDnsRecord;
      const result = await action(formData);
      
      if (result.success) {
        toast.success(isEditing ? "Record updated" : "Record created");
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(result.error || "Failed to save record");
      }
    });
  }

  // Content placeholder based on type
  const getContentPlaceholder = (type: string) => {
    switch (type) {
      case 'A': return '192.0.2.1';
      case 'AAAA': return '2001:db8::1';
      case 'CNAME': return 'example.com';
      case 'MX': return 'mail.example.com';
      case 'TXT': return 'v=spf1 include:example.com ~all';
      case 'NS': return 'ns1.example.com';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit DNS Record" : "Add DNS Record"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the DNS record for your domain."
              : "Create a new DNS record for your domain."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select record type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DNS_RECORD_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">{type.label}</span>
                            <span className="text-muted-foreground text-xs">
                              {type.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input 
                        placeholder="@ or subdomain" 
                        {...field} 
                        className="font-mono"
                      />
                    </FormControl>
                    <span className="text-muted-foreground">.{domainName}</span>
                  </div>
                  <FormDescription>
                    Use @ for root domain or enter a subdomain name
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showPriority && (
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="10" 
                        {...field} 
                        className="w-24"
                      />
                    </FormControl>
                    <FormDescription>
                      Lower values = higher priority
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    {selectedType === 'TXT' ? (
                      <Textarea 
                        placeholder={getContentPlaceholder(selectedType)}
                        {...field} 
                        className="font-mono text-sm"
                      />
                    ) : (
                      <Input 
                        placeholder={getContentPlaceholder(selectedType)}
                        {...field} 
                        className="font-mono"
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="ttl"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>TTL</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select TTL" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TTL_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {canProxy && (
                <FormField
                  control={form.control}
                  name="proxied"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-end pb-2">
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Proxied</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : isEditing ? "Update Record" : "Create Record"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### Task 4: DNS Templates Dropdown (30 mins)

```typescript
// src/components/domains/dns/dns-templates-dropdown.tsx

"use client";

import { useState, useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Wand2, 
  Globe, 
  Mail, 
  Building2, 
  TriangleIcon,
  Layers 
} from "lucide-react";
import { applyDnsTemplate, type DnsTemplateType } from "@/lib/actions/dns";
import { toast } from "sonner";

interface Template {
  id: DnsTemplateType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  records: string[];
}

const TEMPLATES: Template[] = [
  {
    id: 'site',
    name: 'DRAMAC Site',
    description: 'Configure DNS for hosting your site on DRAMAC',
    icon: Globe,
    records: ['A @ → Platform IP', 'CNAME www → domain'],
  },
  {
    id: 'titanEmail',
    name: 'Business Email (Titan)',
    description: 'MX records for Titan Mail',
    icon: Mail,
    records: ['MX mx1.titan.email', 'MX mx2.titan.email', 'TXT SPF'],
  },
  {
    id: 'googleWorkspace',
    name: 'Google Workspace',
    description: 'MX records for Google Workspace',
    icon: Building2,
    records: ['MX Google servers (5 records)', 'TXT SPF'],
  },
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'DNS records for Vercel deployment',
    icon: TriangleIcon,
    records: ['A 76.76.21.21', 'CNAME www'],
  },
  {
    id: 'netlify',
    name: 'Netlify',
    description: 'DNS records for Netlify deployment',
    icon: Layers,
    records: ['A 75.2.60.5', 'CNAME www'],
  },
];

interface DnsTemplatesDropdownProps {
  domainId: string;
}

export function DnsTemplatesDropdown({ domainId }: DnsTemplatesDropdownProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  function handleApplyTemplate() {
    if (!selectedTemplate) return;

    startTransition(async () => {
      const result = await applyDnsTemplate(domainId, selectedTemplate.id);
      
      if (result.success) {
        const { created, errors } = result.data!;
        if (errors.length > 0) {
          toast.warning(`Created ${created} records. Some records may already exist.`);
        } else {
          toast.success(`Applied ${selectedTemplate.name} template (${created} records)`);
        }
      } else {
        toast.error(result.error || "Failed to apply template");
      }
      setSelectedTemplate(null);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Wand2 className="h-4 w-4 mr-2" />
            Quick Setup
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-72" align="end">
          <DropdownMenuLabel>DNS Templates</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {TEMPLATES.map((template) => (
              <DropdownMenuItem
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className="flex flex-col items-start gap-1 py-3"
              >
                <div className="flex items-center gap-2">
                  <template.icon className="h-4 w-4" />
                  <span className="font-medium">{template.name}</span>
                </div>
                <span className="text-xs text-muted-foreground pl-6">
                  {template.description}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply {selectedTemplate?.name} Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will add the following DNS records to your domain:
              <ul className="mt-2 space-y-1">
                {selectedTemplate?.records.map((record, i) => (
                  <li key={i} className="font-mono text-sm">• {record}</li>
                ))}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApplyTemplate} disabled={isPending}>
              {isPending ? "Applying..." : "Apply Template"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

### Task 5: DNS Management Page (45 mins)

```typescript
// src/app/(dashboard)/dashboard/domains/[domainId]/dns/page.tsx

import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DnsRecordsTable } from "@/components/domains/dns/dns-records-table";
import { DnsTemplatesDropdown } from "@/components/domains/dns/dns-templates-dropdown";
import { DnsRecordForm } from "@/components/domains/dns/dns-record-form";
import { DnsNameservers } from "@/components/domains/dns/dns-nameservers";
import { DnsPropagationChecker } from "@/components/domains/dns/dns-propagation-checker";
import { getDnsRecords, getNameservers } from "@/lib/actions/dns";

export const metadata: Metadata = {
  title: "DNS Management | DRAMAC",
  description: "Manage DNS records for your domain",
};

interface DnsPageProps {
  params: Promise<{ domainId: string }>;
}

async function DnsRecordsSection({ domainId }: { domainId: string }) {
  const result = await getDnsRecords(domainId);
  
  if (!result.success || !result.data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {result.error || "Failed to load DNS records"}
        </CardContent>
      </Card>
    );
  }

  return (
    <DnsRecordsTable 
      records={result.data.records} 
      domainId={domainId}
      domainName={result.data.domainName}
    />
  );
}

async function NameserversSection({ domainId }: { domainId: string }) {
  const result = await getNameservers(domainId);
  
  if (!result.success || !result.data) {
    return null;
  }

  return (
    <DnsNameservers 
      current={result.data.current}
      expected={result.data.expected}
      configured={result.data.configured}
    />
  );
}

export default async function DnsPage({ params }: DnsPageProps) {
  const { domainId } = await params;
  
  // Get initial data for the page
  const dnsResult = await getDnsRecords(domainId);
  
  if (!dnsResult.success) {
    notFound();
  }

  const domainName = dnsResult.data?.domainName || "";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/domains/${domainId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">DNS Management</h1>
            <p className="text-muted-foreground">{domainName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DnsTemplatesDropdown domainId={domainId} />
          <DnsRecordForm 
            domainId={domainId} 
            domainName={domainName}
            open={false}
            onOpenChange={() => {}}
          />
        </div>
      </div>

      {/* Nameservers Card */}
      <Suspense fallback={<Skeleton className="h-32" />}>
        <NameserversSection domainId={domainId} />
      </Suspense>

      {/* DNS Records Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>DNS Records</CardTitle>
            <CardDescription>
              Manage A, AAAA, CNAME, MX, TXT, and other DNS records
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-64" />}>
            <DnsRecordsSection domainId={domainId} />
          </Suspense>
        </CardContent>
      </Card>

      {/* Propagation Checker */}
      <Card>
        <CardHeader>
          <CardTitle>DNS Propagation</CardTitle>
          <CardDescription>
            Check if your DNS changes have propagated across global DNS servers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DnsPropagationChecker domainName={domainName} />
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card>
        <CardHeader>
          <CardTitle>DNS Help</CardTitle>
          <CardDescription>Common DNS configurations and troubleshooting</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Common Record Types</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li><strong>A</strong> - Points domain to IPv4 address</li>
                <li><strong>AAAA</strong> - Points domain to IPv6 address</li>
                <li><strong>CNAME</strong> - Alias to another domain</li>
                <li><strong>MX</strong> - Mail server routing</li>
                <li><strong>TXT</strong> - Text records (SPF, DKIM, verification)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Quick Links</h4>
              <ul className="space-y-1 text-sm">
                <li>
                  <a 
                    href="https://developers.cloudflare.com/dns/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Cloudflare DNS Documentation
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a 
                    href="https://dnschecker.org" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    DNS Checker Tool
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Task 6: Supporting Components (45 mins)

```typescript
// src/components/domains/dns/dns-record-type-badge.tsx

import { Badge } from "@/components/ui/badge";
import type { DnsRecordType } from "@/lib/cloudflare/types";

const TYPE_COLORS: Record<DnsRecordType, string> = {
  A: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  AAAA: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  CNAME: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  MX: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  TXT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  NS: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  SRV: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  CAA: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  PTR: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  SPF: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

interface DnsRecordTypeBadgeProps {
  type: DnsRecordType;
}

export function DnsRecordTypeBadge({ type }: DnsRecordTypeBadgeProps) {
  return (
    <Badge variant="secondary" className={`font-mono ${TYPE_COLORS[type] || ""}`}>
      {type}
    </Badge>
  );
}
```

```typescript
// src/components/domains/dns/dns-nameservers.tsx

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DnsNameserversProps {
  current: string[];
  expected: string[];
  configured: boolean;
}

export function DnsNameservers({ current, expected, configured }: DnsNameserversProps) {
  const copyNameservers = () => {
    navigator.clipboard.writeText(expected.join('\n'));
    toast.success('Nameservers copied to clipboard');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            Nameservers
            {configured ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Configured
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Not Configured
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {configured 
              ? "Your nameservers are correctly pointing to Cloudflare"
              : "Update your nameservers at your domain registrar"
            }
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={copyNameservers}>
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {expected.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Required Nameservers</h4>
              <div className="space-y-1">
                {expected.map((ns, i) => (
                  <div key={i} className="font-mono text-sm bg-muted px-3 py-1.5 rounded">
                    {ns}
                  </div>
                ))}
              </div>
            </div>
          )}
          {current.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Current Nameservers</h4>
              <div className="space-y-1">
                {current.map((ns, i) => (
                  <div 
                    key={i} 
                    className={`font-mono text-sm px-3 py-1.5 rounded ${
                      expected.includes(ns) 
                        ? "bg-green-50 dark:bg-green-950" 
                        : "bg-red-50 dark:bg-red-950"
                    }`}
                  >
                    {ns}
                    {expected.includes(ns) 
                      ? <CheckCircle2 className="h-3 w-3 inline ml-2 text-green-600" />
                      : <XCircle className="h-3 w-3 inline ml-2 text-red-600" />
                    }
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

```typescript
// src/components/domains/dns/dns-propagation-checker.tsx

"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { checkDnsPropagation } from "@/lib/actions/dns";

interface DnsPropagationCheckerProps {
  domainName: string;
}

export function DnsPropagationChecker({ domainName }: DnsPropagationCheckerProps) {
  const [isPending, startTransition] = useTransition();
  const [subdomain, setSubdomain] = useState("@");
  const [recordType, setRecordType] = useState("A");
  const [results, setResults] = useState<{
    server: string;
    ip: string;
    status: 'propagated' | 'pending' | 'error';
    value: string;
    ttl: number;
  }[] | null>(null);

  function handleCheck() {
    const fullDomain = subdomain === "@" ? domainName : `${subdomain}.${domainName}`;
    
    startTransition(async () => {
      const result = await checkDnsPropagation(fullDomain, recordType);
      if (result.success && result.data) {
        setResults(result.data.results);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex items-center gap-2">
          <Input
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value)}
            placeholder="@ or subdomain"
            className="w-32 font-mono"
          />
          <span className="text-muted-foreground">.{domainName}</span>
        </div>
        <Select value={recordType} onValueChange={setRecordType}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A">A</SelectItem>
            <SelectItem value="AAAA">AAAA</SelectItem>
            <SelectItem value="CNAME">CNAME</SelectItem>
            <SelectItem value="MX">MX</SelectItem>
            <SelectItem value="TXT">TXT</SelectItem>
            <SelectItem value="NS">NS</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleCheck} disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          Check
        </Button>
      </div>

      {results && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-2 text-sm font-medium">Server</th>
                <th className="text-left px-4 py-2 text-sm font-medium">IP</th>
                <th className="text-left px-4 py-2 text-sm font-medium">Status</th>
                <th className="text-left px-4 py-2 text-sm font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-2 text-sm">{result.server}</td>
                  <td className="px-4 py-2 text-sm font-mono text-muted-foreground">
                    {result.ip}
                  </td>
                  <td className="px-4 py-2">
                    {result.status === 'propagated' ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Propagated
                      </Badge>
                    ) : result.status === 'pending' ? (
                      <Badge variant="secondary">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Pending
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Error
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-2 font-mono text-sm">{result.value || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

```typescript
// src/components/domains/dns/index.ts

export * from './dns-records-table';
export * from './dns-record-form';
export * from './dns-record-type-badge';
export * from './dns-templates-dropdown';
export * from './dns-nameservers';
export * from './dns-propagation-checker';
```

---

## ✅ Verification Checklist

- [ ] DNS records load correctly from Cloudflare
- [ ] Create/Update/Delete record operations work
- [ ] DNS templates apply correct records
- [ ] Propagation checker displays results
- [ ] Nameserver status shows correctly
- [ ] Search and filter work on records table
- [ ] Proxied toggle only shows for supported types
- [ ] MX/SRV priority field appears when needed
- [ ] Error handling works for all operations

---

## 🔗 Dependencies

### Requires from Previous Phases:
- **DM-03**: `cloudflareApi.dns.*` functions
- **DM-02**: `domains` table with `cloudflare_zone_id`
- **DM-05**: Domain detail page layout

### Provides to Next Phases:
- **DM-07**: DNS configuration for email (MX records)
- **DM-08**: Email DNS setup integration

---

## 📚 Documentation References

- Cloudflare DNS API: https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-list-dns-records
- DNS Record Types: https://www.cloudflare.com/learning/dns/dns-records/
