"use client";

import { useState, useTransition } from "react";
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
import type { DnsRecordType } from "@/lib/cloudflare/types";

interface DnsRecordData {
  id: string;
  type: DnsRecordType;
  name: string;
  content: string;
  ttl: number;
  priority?: number;
  proxied: boolean;
  proxiable?: boolean;
  status: string;
}

interface DnsRecordsTableProps {
  records: DnsRecordData[];
  domainId: string;
  domainName: string;
}

export function DnsRecordsTable({ records, domainId, domainName }: DnsRecordsTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [editingRecord, setEditingRecord] = useState<DnsRecordData | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<DnsRecordData | null>(null);
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
    if (name === '@') {
      return '@';
    }
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
                    {record.priority !== undefined && (
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
              <span className="font-mono">{formatName(deletingRecord?.name || '')}</span>? 
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
