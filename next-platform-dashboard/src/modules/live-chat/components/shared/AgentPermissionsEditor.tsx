"use client";

import { useState, useTransition, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Shield,
  RotateCcw,
  MessageSquare,
  FileText,
  Package,
  Users,
  ShoppingBag,
  Calendar,
  BarChart3,
  UserCog,
  Settings,
  ChevronDown,
  ChevronRight,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { updateAgentPermissions } from "@/modules/live-chat/actions/agent-actions";
import type { ChatAgent, AgentRole } from "@/modules/live-chat/types";
import {
  type PermissionKey,
  type PermissionCategory,
  type AgentPermissions,
  getPermissionsByCategory,
  getEffectivePermissions,
  getDefaultPermissions,
  countPermissions,
} from "@/modules/live-chat/lib/agent-permissions";

// ─── Icon Map ────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<PermissionCategory, React.ReactNode> = {
  chat: <MessageSquare className="h-4 w-4" />,
  quotes: <FileText className="h-4 w-4" />,
  orders: <Package className="h-4 w-4" />,
  customers: <Users className="h-4 w-4" />,
  products: <ShoppingBag className="h-4 w-4" />,
  bookings: <Calendar className="h-4 w-4" />,
  analytics: <BarChart3 className="h-4 w-4" />,
  agents: <UserCog className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface AgentPermissionsEditorProps {
  agent: ChatAgent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (agent: ChatAgent, permissions: AgentPermissions) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AgentPermissionsEditor({
  agent,
  open,
  onOpenChange,
  onSaved,
}: AgentPermissionsEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [localPermissions, setLocalPermissions] = useState<AgentPermissions>(
    () => agent.permissions || {},
  );
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(),
  );

  const grouped = getPermissionsByCategory();
  const effective = getEffectivePermissions(agent.role, localPermissions);
  const defaults = getDefaultPermissions(agent.role);
  const { enabled, total } = countPermissions(agent.role, localPermissions);
  const hasCustomOverrides = Object.keys(localPermissions).length > 0;

  // ─── Handlers ────────────────────────────────────────────────────────

  const togglePermission = useCallback(
    (key: PermissionKey, checked: boolean) => {
      setLocalPermissions((prev) => {
        const next = { ...prev };
        const roleDefault = defaults[key];

        if (checked === roleDefault) {
          // If matches role default, remove override
          delete next[key];
        } else {
          next[key] = checked;
        }

        return next;
      });
    },
    [defaults],
  );

  const toggleCategory = useCallback(
    (categoryKey: string, enable: boolean) => {
      const categoryPerms = grouped.find((g) => g.category.key === categoryKey);
      if (!categoryPerms) return;

      setLocalPermissions((prev) => {
        const next = { ...prev };
        for (const perm of categoryPerms.permissions) {
          if (enable === defaults[perm.key]) {
            delete next[perm.key];
          } else {
            next[perm.key] = enable;
          }
        }
        return next;
      });
    },
    [grouped, defaults],
  );

  const resetToDefaults = useCallback(() => {
    setLocalPermissions({});
  }, []);

  const toggleCollapse = useCallback((key: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await updateAgentPermissions(agent.id, localPermissions);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Permissions updated for ${agent.displayName}`);
        onSaved?.(agent, localPermissions);
        onOpenChange(false);
      }
    });
  }, [agent, localPermissions, onSaved, onOpenChange]);

  // Reset local state when agent changes
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        setLocalPermissions(agent.permissions || {});
        setCollapsedCategories(new Set());
      }
      onOpenChange(isOpen);
    },
    [agent, onOpenChange],
  );

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissions — {agent.displayName}
          </DialogTitle>
          <div className="flex items-center gap-2 pt-1">
            <Badge variant="outline" className="text-xs capitalize">
              {agent.role}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {enabled}/{total} permissions enabled
            </span>
            {hasCustomOverrides && (
              <Badge variant="secondary" className="text-xs">
                Custom overrides
              </Badge>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-1 pb-4">
            {grouped.map(({ category, permissions }) => {
              const isCollapsed = collapsedCategories.has(category.key);
              const categoryEnabled = permissions.filter(
                (p) => effective[p.key],
              ).length;
              const allEnabled = categoryEnabled === permissions.length;
              const noneEnabled = categoryEnabled === 0;

              return (
                <div key={category.key} className="border rounded-lg">
                  {/* Category Header */}
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleCollapse(category.key)}
                  >
                    <div className="flex items-center gap-3">
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-muted-foreground">
                        {CATEGORY_ICONS[category.key]}
                      </span>
                      <span className="font-medium text-sm">
                        {category.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {categoryEnabled}/{permissions.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategory(category.key, !allEnabled);
                        }}
                      >
                        {allEnabled ? "Disable All" : "Enable All"}
                      </Button>
                    </div>
                  </div>

                  {/* Permission Rows */}
                  {!isCollapsed && (
                    <div className="border-t">
                      {permissions.map((perm, idx) => {
                        const isEnabled = effective[perm.key];
                        const isDefault = defaults[perm.key];
                        const isOverridden =
                          localPermissions[perm.key] !== undefined;

                        return (
                          <div
                            key={perm.key}
                            className={`flex items-center justify-between px-4 py-2.5 ${
                              idx < permissions.length - 1 ? "border-b" : ""
                            } ${isOverridden ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}
                          >
                            <div className="flex-1 min-w-0 pl-7">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{perm.label}</span>
                                {isOverridden && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1 py-0 h-4 text-blue-600 border-blue-300"
                                  >
                                    custom
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {perm.description}
                              </p>
                            </div>
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={(checked) =>
                                togglePermission(perm.key, checked)
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t -mx-6 px-6">
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            disabled={!hasCustomOverrides || isPending}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset to Role Defaults
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1.5" />
              )}
              Save Permissions
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
