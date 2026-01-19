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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Users,
  Settings,
  Trash2,
  Loader2,
  Building2,
  Zap,
  Beaker,
  Sparkles,
  FlaskConical,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  enrollAgencyInBeta,
  updateBetaEnrollment,
  removeAgencyFromBeta,
  type BetaEnrollment,
  type BetaTier,
  type BetaTierInfo,
  type BetaPreferences,
} from "@/lib/modules/beta-program";

interface AvailableAgency {
  id: string;
  name: string;
  ownerEmail: string | null;
  isEnrolled: boolean;
  currentTier?: BetaTier;
}

interface Props {
  enrollments: BetaEnrollment[];
  availableAgencies: AvailableAgency[];
  betaTiers: Record<BetaTier, BetaTierInfo>;
}

const TIER_ICONS: Record<BetaTier, React.ReactNode> = {
  internal: <Zap className="h-4 w-4" />,
  alpha: <Beaker className="h-4 w-4" />,
  early_access: <Sparkles className="h-4 w-4" />,
  standard: <FlaskConical className="h-4 w-4" />,
};

const TIER_COLORS: Record<BetaTier, string> = {
  internal: "border-red-500 text-red-600 bg-red-50 dark:bg-red-950",
  alpha: "border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950",
  early_access: "border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950",
  standard: "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950",
};

export function BetaProgramManagement({
  enrollments,
  availableAgencies,
  betaTiers,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<BetaEnrollment | null>(
    null
  );

  // Form state
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>("");
  const [selectedTier, setSelectedTier] = useState<BetaTier>("standard");
  const [receiveNotifications, setReceiveNotifications] = useState(true);
  const [autoEnrollNewBetas, setAutoEnrollNewBetas] = useState(false);

  const nonEnrolledAgencies = availableAgencies.filter((a) => !a.isEnrolled);

  const resetForm = () => {
    setSelectedAgencyId("");
    setSelectedTier("standard");
    setReceiveNotifications(true);
    setAutoEnrollNewBetas(false);
  };

  const handleEnrollAgency = async () => {
    if (!selectedAgencyId) return;

    startTransition(async () => {
      const result = await enrollAgencyInBeta(selectedAgencyId, selectedTier, {
        receiveNotifications,
        autoEnrollNewBetas,
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

  const handleUpdateEnrollment = async () => {
    if (!editingEnrollment) return;

    startTransition(async () => {
      const result = await updateBetaEnrollment(editingEnrollment.agencyId, {
        tier: selectedTier,
        preferences: {
          receiveNotifications,
          autoEnrollNewBetas,
        },
      });

      if (result.success) {
        setEditingEnrollment(null);
        resetForm();
        router.refresh();
      } else {
        alert(`Error: ${result.error}`);
      }
    });
  };

  const handleRemoveEnrollment = async (agencyId: string) => {
    startTransition(async () => {
      const result = await removeAgencyFromBeta(agencyId);

      if (result.success) {
        router.refresh();
      } else {
        alert(`Error: ${result.error}`);
      }
    });
  };

  const openEditDialog = (enrollment: BetaEnrollment) => {
    setEditingEnrollment(enrollment);
    setSelectedTier(enrollment.betaTier);
    setReceiveNotifications(enrollment.preferences.receiveNotifications ?? true);
    setAutoEnrollNewBetas(enrollment.preferences.autoEnrollNewBetas ?? false);
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
              <Users className="h-6 w-6" />
              Beta Program
            </h1>
            <p className="text-muted-foreground">
              Manage agency enrollments in the beta testing program
            </p>
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={nonEnrolledAgencies.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Enroll Agency
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Enroll Agency in Beta</DialogTitle>
              <DialogDescription>
                Give an agency access to testing modules
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Agency</Label>
                <Select value={selectedAgencyId} onValueChange={setSelectedAgencyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an agency..." />
                  </SelectTrigger>
                  <SelectContent>
                    {nonEnrolledAgencies.map((agency) => (
                      <SelectItem key={agency.id} value={agency.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span>{agency.name}</span>
                            {agency.ownerEmail && (
                              <span className="text-xs text-muted-foreground">
                                {agency.ownerEmail}
                              </span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Beta Tier</Label>
                <Select
                  value={selectedTier}
                  onValueChange={(v) => setSelectedTier(v as BetaTier)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(betaTiers) as [BetaTier, BetaTierInfo][]).map(
                      ([tier, info]) => (
                        <SelectItem key={tier} value={tier}>
                          <div className="flex items-center gap-2">
                            {TIER_ICONS[tier]}
                            <div className="flex flex-col">
                              <span>{info.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {info.description}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Receive Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Get notified about new beta modules
                    </p>
                  </div>
                  <Switch
                    checked={receiveNotifications}
                    onCheckedChange={setReceiveNotifications}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Enroll New Betas</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically opt into all new beta modules
                    </p>
                  </div>
                  <Switch
                    checked={autoEnrollNewBetas}
                    onCheckedChange={setAutoEnrollNewBetas}
                  />
                </div>
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
                onClick={handleEnrollAgency}
                disabled={!selectedAgencyId || isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  "Enroll Agency"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tier Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Object.entries(betaTiers) as [BetaTier, BetaTierInfo][]).map(
          ([tier, info]) => {
            const count = enrollments.filter((e) => e.betaTier === tier).length;
            return (
              <Card key={tier}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${TIER_COLORS[tier]} border`}
                    >
                      {TIER_ICONS[tier]}
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground">{info.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }
        )}
      </div>

      {/* Enrollments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Beta Enrollments</CardTitle>
          <CardDescription>
            {enrollments.length} agenc{enrollments.length !== 1 ? "ies" : "y"}{" "}
            enrolled in beta testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No agencies enrolled</p>
              <p className="text-sm mt-1">
                Enroll agencies to give them access to testing modules
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agency</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Preferences</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{enrollment.agencyName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${TIER_COLORS[enrollment.betaTier]} flex items-center gap-1 w-fit`}
                      >
                        {TIER_ICONS[enrollment.betaTier]}
                        {betaTiers[enrollment.betaTier].name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {enrollment.acceptedModules.length} modules
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {enrollment.preferences.receiveNotifications && (
                          <Badge variant="outline" className="text-xs">
                            Notifications
                          </Badge>
                        )}
                        {enrollment.preferences.autoEnrollNewBetas && (
                          <Badge variant="outline" className="text-xs">
                            Auto-enroll
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(enrollment.enrolledAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(enrollment)}
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
                              <AlertDialogTitle>
                                Remove from Beta Program
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove &quot;
                                {enrollment.agencyName}&quot; from the beta
                                program? They will lose access to testing modules.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleRemoveEnrollment(enrollment.agencyId)
                                }
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
        open={!!editingEnrollment}
        onOpenChange={(open) => {
          if (!open) {
            setEditingEnrollment(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Enrollment</DialogTitle>
            <DialogDescription>
              Update settings for {editingEnrollment?.agencyName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Beta Tier</Label>
              <Select
                value={selectedTier}
                onValueChange={(v) => setSelectedTier(v as BetaTier)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(betaTiers) as [BetaTier, BetaTierInfo][]).map(
                    ([tier, info]) => (
                      <SelectItem key={tier} value={tier}>
                        <div className="flex items-center gap-2">
                          {TIER_ICONS[tier]}
                          <div className="flex flex-col">
                            <span>{info.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {info.description}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Receive Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified about new beta modules
                  </p>
                </div>
                <Switch
                  checked={receiveNotifications}
                  onCheckedChange={setReceiveNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Enroll New Betas</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically opt into all new beta modules
                  </p>
                </div>
                <Switch
                  checked={autoEnrollNewBetas}
                  onCheckedChange={setAutoEnrollNewBetas}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingEnrollment(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateEnrollment} disabled={isPending}>
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
