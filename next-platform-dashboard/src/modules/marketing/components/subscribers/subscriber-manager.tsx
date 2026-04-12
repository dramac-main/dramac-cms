"use client";

import { useState, useTransition, useRef } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Users,
  UserPlus,
  Upload,
  Mail,
  MoreHorizontal,
  Eye,
  Tag,
  Trash2,
  ListIcon,
} from "lucide-react";
import {
  SUBSCRIBER_STATUS_LABELS,
  LIST_TYPE_LABELS,
} from "../../lib/marketing-constants";
import {
  createSubscriber,
  updateSubscriber,
  deleteSubscriber,
  bulkImportSubscribers,
} from "../../actions/subscriber-actions";
import {
  createMailingList,
  deleteMailingList,
} from "../../actions/audience-actions";
import type {
  Subscriber,
  SubscriberStatus,
  MailingList,
} from "../../types/campaign-types";

interface SubscriberManagerProps {
  siteId: string;
  subscribers: Subscriber[];
  subscriberTotal: number;
  mailingLists: MailingList[];
  page: number;
  limit: number;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  unsubscribed: "bg-red-100 text-red-700",
  bounced: "bg-orange-100 text-orange-700",
  complained: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
  cleaned: "bg-gray-100 text-gray-700",
};

export function SubscriberManager({
  siteId,
  subscribers,
  subscriberTotal,
  mailingLists,
  page,
  limit,
}: SubscriberManagerProps) {
  const router = useRouter();
  const params = useParams();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("subscribers");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showListDialog, setShowListDialog] = useState(false);

  const basePath = `/dashboard/sites/${params.siteId}/marketing`;
  const totalPages = Math.ceil(subscriberTotal / limit);

  function handleSearch(value: string) {
    setSearch(value);
    const searchParams = new URLSearchParams();
    if (value) searchParams.set("search", value);
    if (statusFilter !== "all") searchParams.set("status", statusFilter);
    router.push(`${basePath}/subscribers?${searchParams.toString()}`);
  }

  function handleStatusFilter(value: string) {
    setStatusFilter(value);
    const searchParams = new URLSearchParams();
    if (search) searchParams.set("search", search);
    if (value !== "all") searchParams.set("status", value);
    router.push(`${basePath}/subscribers?${searchParams.toString()}`);
  }

  function handleDelete(id: string, email: string) {
    if (!confirm(`Delete subscriber "${email}"? This cannot be undone.`))
      return;
    startTransition(async () => {
      try {
        await deleteSubscriber(siteId, id);
        router.refresh();
      } catch (err: any) {
        alert(err.message);
      }
    });
  }

  function handleDeleteList(id: string, name: string) {
    if (!confirm(`Delete list "${name}"?`)) return;
    startTransition(async () => {
      try {
        await deleteMailingList(siteId, id);
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
            <h1 className="text-2xl font-bold tracking-tight">Subscribers</h1>
            <p className="text-muted-foreground">
              Manage your email subscribers and mailing lists
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Subscribers</DialogTitle>
                </DialogHeader>
                <ImportForm
                  siteId={siteId}
                  onSuccess={() => {
                    setShowImportDialog(false);
                    router.refresh();
                  }}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Subscriber
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Subscriber</DialogTitle>
                </DialogHeader>
                <AddSubscriberForm
                  siteId={siteId}
                  onSuccess={() => {
                    setShowAddDialog(false);
                    router.refresh();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="subscribers">
            <Users className="mr-2 h-4 w-4" />
            Subscribers ({subscriberTotal})
          </TabsTrigger>
          <TabsTrigger value="lists">
            <ListIcon className="mr-2 h-4 w-4" />
            Lists ({mailingLists.length})
          </TabsTrigger>
        </TabsList>

        {/* Subscribers Tab */}
        <TabsContent value="subscribers" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
              <Input
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(SUBSCRIBER_STATUS_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Subscriber Table */}
          {subscribers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Users className="text-muted-foreground mb-4 h-12 w-12" />
                <h3 className="text-lg font-semibold">No subscribers yet</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Add your first subscriber or import from a CSV file
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-medium">Email</th>
                      <th className="px-4 py-3 text-left font-medium">Name</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Engagement
                      </th>
                      <th className="px-4 py-3 text-left font-medium">Tags</th>
                      <th className="px-4 py-3 text-left font-medium">Added</th>
                      <th className="w-10 px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((sub: any) => (
                      <tr
                        key={sub.id}
                        className="border-b last:border-0 hover:bg-muted/50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Mail className="text-muted-foreground h-3.5 w-3.5" />
                            <span className="font-medium">{sub.email}</span>
                          </div>
                        </td>
                        <td className="text-muted-foreground px-4 py-3">
                          {[sub.first_name, sub.last_name]
                            .filter(Boolean)
                            .join(" ") || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${STATUS_COLORS[sub.status] || ""}`}
                          >
                            {SUBSCRIBER_STATUS_LABELS[
                              sub.status as SubscriberStatus
                            ] || sub.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <div
                              className="h-2 rounded-full bg-blue-500"
                              style={{
                                width: `${Math.min(sub.engagement_score || 0, 100)}%`,
                                maxWidth: "60px",
                                minWidth: "4px",
                              }}
                            />
                            <span className="text-muted-foreground text-xs">
                              {sub.engagement_score || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(sub.tags || []).slice(0, 3).map((tag: string) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {(sub.tags || []).length > 3 && (
                              <span className="text-muted-foreground text-xs">
                                +{sub.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-muted-foreground px-4 py-3 text-xs">
                          {new Date(sub.created_at).toLocaleDateString("en-ZM")}
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Tag className="mr-2 h-4 w-4" />
                                Manage Tags
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(sub.id, sub.email)}
                                disabled={isPending}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => {
                  const sp = new URLSearchParams();
                  if (search) sp.set("search", search);
                  if (statusFilter !== "all") sp.set("status", statusFilter);
                  sp.set("page", String(page - 1));
                  router.push(`${basePath}/subscribers?${sp.toString()}`);
                }}
              >
                Previous
              </Button>
              <span className="text-muted-foreground text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => {
                  const sp = new URLSearchParams();
                  if (search) sp.set("search", search);
                  if (statusFilter !== "all") sp.set("status", statusFilter);
                  sp.set("page", String(page + 1));
                  router.push(`${basePath}/subscribers?${sp.toString()}`);
                }}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Lists Tab */}
        <TabsContent value="lists" className="mt-4 space-y-4">
          <div className="flex items-center justify-end">
            <Dialog open={showListDialog} onOpenChange={setShowListDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  New List
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Mailing List</DialogTitle>
                </DialogHeader>
                <CreateListForm
                  siteId={siteId}
                  onSuccess={() => {
                    setShowListDialog(false);
                    router.refresh();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          {mailingLists.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <ListIcon className="text-muted-foreground mb-4 h-12 w-12" />
                <h3 className="text-lg font-semibold">No mailing lists</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Create lists to organize your subscribers
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mailingLists.map((list: any) => (
                <Card key={list.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{list.name}</CardTitle>
                        {list.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {list.description}
                          </CardDescription>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteList(list.id, list.name)}
                            disabled={isPending}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="outline">
                        {LIST_TYPE_LABELS[
                          list.type as keyof typeof LIST_TYPE_LABELS
                        ] || list.type}
                      </Badge>
                      <span className="text-muted-foreground">
                        {list.subscriber_count || 0} subscribers
                      </span>
                    </div>
                    {list.is_double_opt_in && (
                      <p className="text-muted-foreground mt-2 text-xs">
                        Double opt-in enabled
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// FORM COMPONENTS
// ============================================================================

function AddSubscriberForm({
  siteId,
  onSuccess,
}: {
  siteId: string;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [tags, setTags] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    startTransition(async () => {
      try {
        await createSubscriber(siteId, {
          email,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          tags: tags
            ? tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : undefined,
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
        <Label htmlFor="add-email">Email *</Label>
        <Input
          id="add-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="subscriber@example.com"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="add-first">First Name</Label>
          <Input
            id="add-first"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="add-last">Last Name</Label>
          <Input
            id="add-last"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="add-tags">Tags</Label>
        <Input
          id="add-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="tag1, tag2, tag3"
        />
        <p className="text-muted-foreground mt-1 text-xs">
          Comma-separated list of tags
        </p>
      </div>
      <Button
        type="submit"
        disabled={isPending || !email.trim()}
        className="w-full"
      >
        {isPending ? "Adding..." : "Add Subscriber"}
      </Button>
    </form>
  );
}

function ImportForm({
  siteId,
  onSuccess,
}: {
  siteId: string;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [csvText, setCsvText] = useState("");
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(reader.result as string);
    reader.readAsText(file);
  }

  function parseCsv(
    text: string,
  ): Array<{ email: string; firstName?: string; lastName?: string }> {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0]
      .toLowerCase()
      .split(",")
      .map((h) => h.trim());
    const emailIdx = headers.findIndex(
      (h) => h === "email" || h === "e-mail" || h === "email_address",
    );
    if (emailIdx === -1) return [];
    const firstIdx = headers.findIndex(
      (h) => h === "first_name" || h === "firstname" || h === "first",
    );
    const lastIdx = headers.findIndex(
      (h) => h === "last_name" || h === "lastname" || h === "last",
    );

    return lines
      .slice(1)
      .map((line) => {
        const cols = line.split(",").map((c) => c.trim());
        return {
          email: cols[emailIdx] || "",
          firstName: firstIdx >= 0 ? cols[firstIdx] : undefined,
          lastName: lastIdx >= 0 ? cols[lastIdx] : undefined,
        };
      })
      .filter((r) => r.email.includes("@"));
  }

  function handleImport() {
    const records = parseCsv(csvText);
    if (records.length === 0) {
      alert("No valid records found. Ensure CSV has an 'email' column header.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await bulkImportSubscribers(siteId, records);
        setResult(res);
      } catch (err: any) {
        alert(err.message);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>CSV File</Label>
        <Input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
        />
        <p className="text-muted-foreground mt-1 text-xs">
          CSV must have an &quot;email&quot; column. Optional: first_name,
          last_name
        </p>
      </div>
      {csvText && (
        <p className="text-muted-foreground text-sm">
          {parseCsv(csvText).length} valid records found
        </p>
      )}
      {result && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          Imported: {result.imported} | Skipped: {result.skipped} | Failed:{" "}
          {result.errors.length}
        </div>
      )}
      <div className="flex gap-2">
        <Button
          onClick={handleImport}
          disabled={isPending || !csvText}
          className="flex-1"
        >
          {isPending ? "Importing..." : "Import"}
        </Button>
        {result && (
          <Button variant="outline" onClick={onSuccess}>
            Done
          </Button>
        )}
      </div>
    </div>
  );
}

function CreateListForm({
  siteId,
  onSuccess,
}: {
  siteId: string;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("manual");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      try {
        await createMailingList(siteId, {
          name,
          description: description || undefined,
          type: type as any,
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
        <Label htmlFor="list-name">Name *</Label>
        <Input
          id="list-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Newsletter Subscribers"
          required
        />
      </div>
      <div>
        <Label htmlFor="list-desc">Description</Label>
        <Input
          id="list-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
        />
      </div>
      <div>
        <Label>Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(LIST_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="submit"
        disabled={isPending || !name.trim()}
        className="w-full"
      >
        {isPending ? "Creating..." : "Create List"}
      </Button>
    </form>
  );
}
