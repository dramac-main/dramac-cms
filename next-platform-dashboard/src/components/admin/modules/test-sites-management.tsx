"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Plus,
  Globe,
  Settings,
  Trash2,
  Loader2,
  FlaskConical,
  Calendar,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import {
  createTestSite,
  updateTestSite,
  removeTestSite,
  type TestSite,
  type TestFeature,
} from "@/lib/modules/test-site-manager";

interface AvailableSite {
  id: string;
  name: string;
  slug: string;
  agencyName: string;
  isTestSite: boolean;
}

interface TestFeatureOption {
  value: TestFeature;
  label: string;
  description: string;
}

interface Props {
  testSites: TestSite[];
  availableSites: AvailableSite[];
  testFeatures: TestFeatureOption[];
}

export function TestSitesManagement({
  testSites,
  availableSites,
  testFeatures,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<TestSite | null>(null);

  // Form state
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [selectedFeatures, setSelectedFeatures] = useState<TestFeature[]>([
    "beta_modules",
  ]);
  const [notes, setNotes] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const nonTestSites = availableSites.filter((s) => !s.isTestSite);

  const resetForm = () => {
    setSelectedSiteId("");
    setSelectedFeatures(["beta_modules"]);
    setNotes("");
    setExpiresAt("");
  };

  const handleAddTestSite = async () => {
    if (!selectedSiteId) return;

    startTransition(async () => {
      const result = await createTestSite(selectedSiteId, {
        testFeatures: selectedFeatures,
        notes: notes || undefined,
        expiresAt: expiresAt || undefined,
      });

      if (result.success) {
        setIsAddDialogOpen(false);
        resetForm();
        router.refresh();
      } else {
        alert(`Error: ${result.error}`);
      }
    });
  };

  const handleUpdateTestSite = async () => {
    if (!editingSite) return;

    startTransition(async () => {
      const result = await updateTestSite(editingSite.siteId, {
        testFeatures: selectedFeatures,
        notes: notes || undefined,
        expiresAt: expiresAt || undefined,
      });

      if (result.success) {
        setEditingSite(null);
        resetForm();
        router.refresh();
      } else {
        alert(`Error: ${result.error}`);
      }
    });
  };

  const handleRemoveTestSite = async (siteId: string) => {
    startTransition(async () => {
      const result = await removeTestSite(siteId);

      if (result.success) {
        router.refresh();
      } else {
        alert(`Error: ${result.error}`);
      }
    });
  };

  const openEditDialog = (site: TestSite) => {
    setEditingSite(site);
    setSelectedFeatures(site.testFeatures as TestFeature[]);
    setNotes(site.notes || "");
    setExpiresAt(site.expiresAt ? site.expiresAt.split("T")[0] : "");
  };

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/modules/testing">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="h-6 w-6" />
              Test Sites
            </h1>
            <p className="text-muted-foreground">
              Designate sites for testing pre-release modules
            </p>
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={nonTestSites.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Add Test Site
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Test Site</DialogTitle>
              <DialogDescription>
                Designate a site for testing pre-release modules
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Site</Label>
                <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a site..." />
                  </SelectTrigger>
                  <SelectContent>
                    {nonTestSites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        <div className="flex flex-col">
                          <span>{site.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {site.agencyName} • {site.slug}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Test Features</Label>
                <div className="space-y-2 border rounded-lg p-3">
                  {testFeatures.map((feature) => (
                    <div key={feature.value} className="flex items-start space-x-2">
                      <Checkbox
                        id={feature.value}
                        checked={selectedFeatures.includes(feature.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedFeatures([...selectedFeatures, feature.value]);
                          } else {
                            setSelectedFeatures(
                              selectedFeatures.filter((f) => f !== feature.value)
                            );
                          }
                        }}
                      />
                      <div className="grid gap-1 leading-none">
                        <label
                          htmlFor={feature.value}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {feature.label}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires">Expiration Date (Optional)</Label>
                <Input
                  id="expires"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={format(new Date(), "yyyy-MM-dd")}
                />
                <p className="text-xs text-muted-foreground">
                  Test site status will expire after this date
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this test site..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddTestSite}
                disabled={!selectedSiteId || isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Test Site"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Test Sites Table */}
      <Card>
        <CardHeader>
          <CardTitle>Configured Test Sites</CardTitle>
          <CardDescription>
            {testSites.length} site{testSites.length !== 1 ? "s" : ""} configured
            for testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {testSites.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No test sites configured</p>
              <p className="text-sm mt-1">
                Add a test site to start testing pre-release modules
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Agency</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testSites.map((site) => (
                  <TableRow key={site.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{site.siteName}</p>
                        <p className="text-sm text-muted-foreground">
                          {site.siteSlug}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{site.agencyName}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {site.testFeatures.map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature.replace("_", " ")}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {site.expiresAt ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(site.expiresAt), "MMM d, yyyy")}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(site.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(site)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Test Site</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove &quot;{site.siteName}
                                &quot; as a test site? This will prevent it from
                                installing testing modules.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveTestSite(site.siteId)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Remove"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingSite}
        onOpenChange={(open) => {
          if (!open) {
            setEditingSite(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Test Site</DialogTitle>
            <DialogDescription>
              Update settings for {editingSite?.siteName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Test Features</Label>
              <div className="space-y-2 border rounded-lg p-3">
                {testFeatures.map((feature) => (
                  <div key={feature.value} className="flex items-start space-x-2">
                    <Checkbox
                      id={`edit-${feature.value}`}
                      checked={selectedFeatures.includes(feature.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedFeatures([...selectedFeatures, feature.value]);
                        } else {
                          setSelectedFeatures(
                            selectedFeatures.filter((f) => f !== feature.value)
                          );
                        }
                      }}
                    />
                    <div className="grid gap-1 leading-none">
                      <label
                        htmlFor={`edit-${feature.value}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {feature.label}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-expires">Expiration Date (Optional)</Label>
              <Input
                id="edit-expires"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes (Optional)</Label>
              <Textarea
                id="edit-notes"
                placeholder="Add any notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingSite(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateTestSite} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
