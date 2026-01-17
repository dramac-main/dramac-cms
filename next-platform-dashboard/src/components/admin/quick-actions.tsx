"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Building2,
  Package,
  Settings,
  BarChart3,
  FileText,
} from "lucide-react";

const QUICK_ACTIONS = [
  {
    label: "Manage Users",
    href: "/admin/users",
    icon: Users,
    description: "View and manage all users",
  },
  {
    label: "Manage Agencies",
    href: "/admin/agencies",
    icon: Building2,
    description: "View and manage agencies",
  },
  {
    label: "Module Management",
    href: "/admin/modules",
    icon: Package,
    description: "Manage platform modules",
  },
  {
    label: "Platform Settings",
    href: "/admin/settings",
    icon: Settings,
    description: "Configure platform",
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    description: "View detailed analytics",
  },
  {
    label: "Audit Logs",
    href: "/admin/audit",
    icon: FileText,
    description: "View system audit logs",
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.href}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              asChild
            >
              <Link href={action.href}>
                <action.icon className="h-5 w-5" />
                <span className="text-sm">{action.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
