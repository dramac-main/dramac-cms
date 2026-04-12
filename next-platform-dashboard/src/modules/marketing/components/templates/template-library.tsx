"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  FileText,
  MoreHorizontal,
  Eye,
  Copy,
  Trash2,
  Star,
} from "lucide-react";
import { TEMPLATE_CATEGORY_LABELS } from "../../lib/marketing-constants";
import {
  createTemplate,
  deleteTemplate,
  duplicateTemplate,
} from "../../actions/template-actions";
import type {
  EmailTemplate,
  TemplateCategory,
} from "../../types/campaign-types";

interface TemplateLibraryProps {
  siteId: string;
  templates: EmailTemplate[];
}

const CATEGORY_COLORS: Record<string, string> = {
  welcome: "bg-green-100 text-green-700",
  promotional: "bg-blue-100 text-blue-700",
  newsletter: "bg-purple-100 text-purple-700",
  transactional: "bg-gray-100 text-gray-700",
  announcement: "bg-amber-100 text-amber-700",
  winback: "bg-red-100 text-red-700",
  seasonal: "bg-pink-100 text-pink-700",
  custom: "bg-indigo-100 text-indigo-700",
};

export function TemplateLibrary({ siteId, templates }: TemplateLibraryProps) {
  const router = useRouter();
  const params = useParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);

  const basePath = `/dashboard/sites/${params.siteId}/marketing`;

  // Client-side filtering
  const filtered = templates.filter((t: any) => {
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    if (
      search &&
      !t.name?.toLowerCase().includes(search.toLowerCase()) &&
      !t.description?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  function handleDuplicate(templateId: string) {
    startTransition(async () => {
      try {
        await duplicateTemplate(siteId, templateId);
        router.refresh();
      } catch (err: any) {
        alert(err.message);
      }
    });
  }

  function handleDelete(templateId: string, name: string) {
    if (!confirm(`Delete template "${name}"?`)) return;
    startTransition(async () => {
      try {
        await deleteTemplate(siteId, templateId);
        router.refresh();
      } catch (err: any) {
        alert(err.message);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
            <p className="text-muted-foreground">
              Reusable email templates for campaigns and sequences
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Template</DialogTitle>
              </DialogHeader>
              <CreateTemplateForm
                siteId={siteId}
                onSuccess={() => {
                  setShowCreateDialog(false);
                  router.refresh();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {Object.entries(TEMPLATE_CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Template Grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-semibold">No templates found</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              {search || categoryFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first email template"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template: any) => (
            <Card
              key={template.id}
              className="group overflow-hidden transition-shadow hover:shadow-md"
            >
              {/* Preview Thumbnail */}
              <div className="bg-muted relative h-36 overflow-hidden">
                {template.content_html ? (
                  <div
                    className="pointer-events-none h-full w-full origin-top-left scale-[0.25] overflow-hidden"
                    style={{ width: "400%", height: "400%" }}
                    dangerouslySetInnerHTML={{
                      __html: template.content_html,
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <FileText className="text-muted-foreground h-10 w-10" />
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                </div>
              </div>

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {template.is_system && (
                        <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                      )}
                      <span className="truncate">{template.name}</span>
                    </CardTitle>
                    {template.description && (
                      <CardDescription className="mt-1 line-clamp-1">
                        {template.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDuplicate(template.id)}
                        disabled={isPending}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      {!template.is_system && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() =>
                              handleDelete(template.id, template.name)
                            }
                            disabled={isPending}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-xs">
                  <Badge
                    variant="secondary"
                    className={
                      CATEGORY_COLORS[template.category] ||
                      "bg-gray-100 text-gray-700"
                    }
                  >
                    {TEMPLATE_CATEGORY_LABELS[
                      template.category as TemplateCategory
                    ] || template.category}
                  </Badge>
                  <span className="text-muted-foreground">
                    Used {template.usage_count || 0} times
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={!!previewTemplate}
        onOpenChange={() => setPreviewTemplate(null)}
      >
        <DialogContent className="max-h-[80vh] max-w-3xl overflow-auto">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate?.content_html ? (
            <div
              className="rounded border p-4"
              dangerouslySetInnerHTML={{
                __html: previewTemplate.content_html,
              }}
            />
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">No HTML preview available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// CREATE TEMPLATE FORM
// ============================================================================

function CreateTemplateForm({
  siteId,
  onSuccess,
}: {
  siteId: string;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("custom");
  const [subjectLine, setSubjectLine] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [contentHtml, setContentHtml] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      try {
        await createTemplate(siteId, {
          name,
          description: description || undefined,
          category: category as TemplateCategory,
          subjectLine: subjectLine || undefined,
          previewText: previewText || undefined,
          contentHtml: contentHtml || undefined,
          contentJson: {},
        });
        onSuccess();
      } catch (err: any) {
        alert(err.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="tpl-name">Name *</Label>
        <Input
          id="tpl-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Welcome Email"
          required
        />
      </div>
      <div>
        <Label htmlFor="tpl-desc">Description</Label>
        <Input
          id="tpl-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
        />
      </div>
      <div>
        <Label>Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TEMPLATE_CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="tpl-subject">Subject Line</Label>
        <Input
          id="tpl-subject"
          value={subjectLine}
          onChange={(e) => setSubjectLine(e.target.value)}
          placeholder="Welcome to {{company_name}}"
        />
      </div>
      <div>
        <Label htmlFor="tpl-preview">Preview Text</Label>
        <Input
          id="tpl-preview"
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          placeholder="Shown in inbox preview"
        />
      </div>
      <div>
        <Label htmlFor="tpl-html">HTML Content</Label>
        <Textarea
          id="tpl-html"
          value={contentHtml}
          onChange={(e) => setContentHtml(e.target.value)}
          placeholder="<html>..."
          rows={6}
          className="font-mono text-xs"
        />
      </div>
      <Button
        type="submit"
        disabled={isPending || !name.trim()}
        className="w-full"
      >
        {isPending ? "Creating..." : "Create Template"}
      </Button>
    </form>
  );
}
