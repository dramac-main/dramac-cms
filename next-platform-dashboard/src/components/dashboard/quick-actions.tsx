import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Globe, Sparkles } from "lucide-react";

interface QuickActionsProps {
  hasClients: boolean;
}

export function QuickActions({ hasClients }: QuickActionsProps) {
  const actions = [
    {
      label: "Add Client",
      description: "Register a new client account",
      icon: UserPlus,
      href: "/dashboard/clients/new",
      variant: "outline" as const,
    },
    {
      label: "Create Site",
      description: hasClients ? "Build a new website" : "Add a client first",
      icon: Globe,
      href: "/dashboard/sites/new",
      variant: "outline" as const,
      disabled: !hasClients,
    },
    {
      label: "AI Builder",
      description: "Generate site with AI",
      icon: Sparkles,
      href: "/dashboard/sites/new?mode=ai",
      variant: "default" as const,
      disabled: !hasClients,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {actions.map((action) => {
            const Icon = action.icon;

            if (action.disabled) {
              return (
                <Button
                  key={action.label}
                  variant={action.variant}
                  disabled
                  className="flex-1 min-w-[150px]"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {action.label}
                </Button>
              );
            }

            return (
              <Link key={action.label} href={action.href}>
                <Button variant={action.variant} className="flex-1 min-w-[150px]">
                  <Icon className="mr-2 h-4 w-4" />
                  {action.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
