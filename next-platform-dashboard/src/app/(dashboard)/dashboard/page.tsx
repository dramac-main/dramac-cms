import { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Globe, TrendingUp, DollarSign } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard | DRAMAC",
  description: "Manage your clients and sites",
};

export default function DashboardPage() {
  // Placeholder stats - will be dynamic in Phase 12
  const stats = [
    {
      title: "Total Clients",
      value: "0",
      description: "Active client accounts",
      icon: Users,
      trend: null,
    },
    {
      title: "Total Sites",
      value: "0",
      description: "Published websites",
      icon: Globe,
      trend: null,
    },
    {
      title: "Monthly Revenue",
      value: "$0",
      description: "This month",
      icon: DollarSign,
      trend: null,
    },
    {
      title: "Growth",
      value: "0%",
      description: "vs last month",
      icon: TrendingUp,
      trend: null,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's an overview of your account."
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-lg">Add New Client</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create a new client account and start building their website.
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-lg">Create New Site</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Start a new website project with our AI-powered builder.
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-lg">Browse Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Explore modules to extend your sites with new features.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
