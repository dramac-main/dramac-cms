/**
 * Form List Client Component
 * Phase MKT-06: Landing Pages & Opt-In Forms
 */
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  FormInput,
  MoreHorizontal,
  Trash2,
  Eye,
  Code,
  BarChart3,
  Plus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FORM_STATUS_CONFIG,
  FORM_STATUS_LABELS,
  FORM_TYPE_LABELS,
} from "../../lib/marketing-constants";
import { deleteForm } from "../../actions/form-actions";
import type { MarketingForm, FormStatus } from "../../types";

interface FormListClientProps {
  siteId: string;
  forms: MarketingForm[];
  total: number;
  currentPage: number;
  pageSize: number;
  currentFormType?: string;
  currentStatus?: string;
  currentSearch?: string;
}

export function FormListClient({
  siteId,
  forms,
  total,
  currentPage,
  pageSize,
  currentFormType,
  currentStatus,
  currentSearch,
}: FormListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch || "");
  const basePath = `/dashboard/sites/${siteId}/marketing/forms`;
  const totalPages = Math.ceil(total / pageSize);

  function applyFilters(
    formType?: string,
    status?: string,
    searchVal?: string,
  ) {
    const params = new URLSearchParams();
    if (formType && formType !== "all") params.set("formType", formType);
    if (status && status !== "all") params.set("status", status);
    if (searchVal) params.set("search", searchVal);
    const qs = params.toString();
    startTransition(() => {
      router.push(`${basePath}${qs ? `?${qs}` : ""}`);
    });
  }

  async function handleDelete(id: string) {
    try {
      await deleteForm(id);
      router.refresh();
      toast.success("Form deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete form");
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Opt-In Forms</h2>
          <p className="text-sm text-muted-foreground">
            {total} form{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href={`${basePath}/new`}>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Form
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search forms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                applyFilters(currentFormType, currentStatus, search);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={currentFormType || "all"}
          onValueChange={(v) => applyFilters(v, currentStatus, search)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(FORM_TYPE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={currentStatus || "all"}
          onValueChange={(v) => applyFilters(currentFormType, v, search)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(FORM_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Form List */}
      {forms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FormInput className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No forms found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {currentFormType || currentStatus || currentSearch
                ? "Try adjusting your filters"
                : "Create your first opt-in form to capture leads"}
            </p>
            {!currentFormType && !currentStatus && !currentSearch && (
              <Link href={`${basePath}/new`} className="mt-4">
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Form
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {forms.map((form) => {
            const status = (form.status as FormStatus) || "draft";
            const config = FORM_STATUS_CONFIG[status];
            return (
              <Card
                key={form.id}
                className="hover:border-primary/30 transition-colors"
              >
                <CardContent className="flex items-center justify-between p-4">
                  <Link
                    href={`${basePath}/${form.id}`}
                    className="flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-3">
                      <FormInput className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {form.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {FORM_TYPE_LABELS[form.formType] || form.formType}
                          {form.fields ? ` · ${form.fields.length} fields` : ""}
                        </p>
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center gap-3 ml-4">
                    {(form.totalSubmissions || 0) > 0 && (
                      <div className="text-right hidden md:block">
                        <p className="text-xs text-muted-foreground">
                          <BarChart3 className="inline h-3 w-3 mr-1" />
                          {form.totalSubmissions?.toLocaleString()} submissions
                        </p>
                      </div>
                    )}

                    <Badge
                      variant="secondary"
                      className={`${config?.bgColor} ${config?.color}`}
                    >
                      {config?.label || status}
                    </Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`${basePath}/${form.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Edit Form
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`${basePath}/${form.id}?tab=embed`}>
                            <Code className="mr-2 h-4 w-4" />
                            Embed Code
                          </Link>
                        </DropdownMenuItem>
                        {status === "draft" && (
                          <DropdownMenuItem
                            onClick={() => handleDelete(form.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1 || isPending}
            onClick={() => {
              const params = new URLSearchParams();
              if (currentFormType) params.set("formType", currentFormType);
              if (currentStatus) params.set("status", currentStatus);
              if (currentSearch) params.set("search", currentSearch);
              params.set("page", String(currentPage - 1));
              router.push(`${basePath}?${params.toString()}`);
            }}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages || isPending}
            onClick={() => {
              const params = new URLSearchParams();
              if (currentFormType) params.set("formType", currentFormType);
              if (currentStatus) params.set("status", currentStatus);
              if (currentSearch) params.set("search", currentSearch);
              params.set("page", String(currentPage + 1));
              router.push(`${basePath}?${params.toString()}`);
            }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
