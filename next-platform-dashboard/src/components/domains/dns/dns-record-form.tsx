"use client";

import { useState, useTransition, useEffect } from "react";
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
  DialogTrigger,
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
import { Plus } from "lucide-react";
import { createDnsRecord, updateDnsRecord } from "@/lib/actions/dns";
import { toast } from "sonner";
import type { DnsRecordType } from "@/lib/cloudflare/types";

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
  ttl: z.string(),
  priority: z.string().optional(),
  proxied: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface DnsRecordData {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  priority?: number;
  proxied: boolean;
}

interface DnsRecordFormProps {
  domainId: string;
  domainName: string;
  record?: DnsRecordData | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function DnsRecordForm({ 
  domainId, 
  domainName, 
  record, 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange,
  trigger,
}: DnsRecordFormProps) {
  const [isPending, startTransition] = useTransition();
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const onOpenChange = isControlled ? controlledOnOpenChange : setInternalOpen;
  
  const isEditing = !!record;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: record?.type || 'A',
      name: record?.name || '@',
      content: record?.content || '',
      ttl: record?.ttl?.toString() || '3600',
      priority: record?.priority?.toString() || '',
      proxied: record?.proxied ?? true,
    },
  });

  // Reset form when record changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        type: record?.type || 'A',
        name: record?.name || '@',
        content: record?.content || '',
        ttl: record?.ttl?.toString() || '3600',
        priority: record?.priority?.toString() || '',
        proxied: record?.proxied ?? true,
      });
    }
  }, [open, record, form]);

  const selectedType = form.watch("type");
  const showPriority = selectedType === "MX" || selectedType === "SRV";
  const canProxy = ['A', 'AAAA', 'CNAME'].includes(selectedType);

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const recordData = {
        type: values.type as DnsRecordType,
        name: values.name,
        content: values.content,
        ttl: parseInt(values.ttl),
        priority: showPriority && values.priority ? parseInt(values.priority) : undefined,
        proxied: canProxy && values.proxied,
      };

      let result;
      if (isEditing && record) {
        result = await updateDnsRecord(domainId, record.id, recordData);
      } else {
        result = await createDnsRecord(domainId, recordData);
      }
      
      if (result.success) {
        toast.success(isEditing ? "Record updated" : "Record created");
        onOpenChange?.(false);
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

  const defaultTrigger = (
    <Button size="sm">
      <Plus className="h-4 w-4 mr-2" />
      Add Record
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger !== undefined ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isControlled ? (
        <DialogTrigger asChild>{defaultTrigger}</DialogTrigger>
      ) : null}
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
                    value={field.value}
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
                    <span className="text-muted-foreground text-sm">.{domainName}</span>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
              <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
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
