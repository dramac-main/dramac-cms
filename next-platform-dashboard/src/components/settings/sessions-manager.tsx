"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Monitor, Smartphone, Globe, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface Session {
  id: string;
  device: string;
  deviceType: "desktop" | "mobile" | "tablet";
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export function SessionsManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToRevoke, setSessionToRevoke] = useState<Session | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    // Simulate fetching sessions
    const fetchSessions = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSessions([
        {
          id: "1",
          device: "Windows PC",
          deviceType: "desktop",
          browser: "Chrome 120",
          location: "Lusaka, Zambia",
          lastActive: "Active now",
          isCurrent: true,
        },
        {
          id: "2",
          device: "iPhone 15",
          deviceType: "mobile",
          browser: "Safari",
          location: "Lusaka, Zambia",
          lastActive: "2 hours ago",
          isCurrent: false,
        },
      ]);
      setIsLoading(false);
    };

    fetchSessions();
  }, []);

  const handleRevoke = async () => {
    if (!sessionToRevoke) return;

    setIsRevoking(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSessions((prev) => prev.filter((s) => s.id !== sessionToRevoke.id));
      toast.success("Session revoked successfully");
    } catch (error) {
      toast.error("Failed to revoke session");
    } finally {
      setIsRevoking(false);
      setSessionToRevoke(null);
    }
  };

  const handleRevokeAll = async () => {
    setIsRevoking(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      toast.success("All other sessions revoked");
    } catch (error) {
      toast.error("Failed to revoke sessions");
    } finally {
      setIsRevoking(false);
    }
  };

  const getDeviceIcon = (type: Session["deviceType"]) => {
    switch (type) {
      case "desktop":
        return Monitor;
      case "mobile":
        return Smartphone;
      default:
        return Globe;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {sessions.length > 1 && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevokeAll}
              disabled={isRevoking}
              className="text-destructive hover:text-destructive"
            >
              Revoke All Other Sessions
            </Button>
          </div>
        )}

        <div className="divide-y">
          {sessions.map((session) => {
            const Icon = getDeviceIcon(session.deviceType);

            return (
              <div
                key={session.id}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-muted">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{session.device}</p>
                      {session.isCurrent && (
                        <Badge variant="default" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {session.browser} · {session.location}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.lastActive}
                    </p>
                  </div>
                </div>

                {!session.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSessionToRevoke(session)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {sessions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No active sessions found.
          </div>
        )}
      </div>

      <AlertDialog
        open={!!sessionToRevoke}
        onOpenChange={() => setSessionToRevoke(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this session? The device will be
              logged out immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isRevoking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
