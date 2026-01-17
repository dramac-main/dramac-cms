"use client";

import Link from "next/link";
import { 
  Package, 
  BarChart3, 
  FileText, 
  Megaphone, 
  Briefcase,
  ShoppingCart,
  Users,
  Settings,
  Zap,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MarketplaceSidebarProps {
  categories: string[];
  selectedCategory?: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  analytics: <BarChart3 className="h-4 w-4" />,
  forms: <FileText className="h-4 w-4" />,
  marketing: <Megaphone className="h-4 w-4" />,
  crm: <Users className="h-4 w-4" />,
  productivity: <Briefcase className="h-4 w-4" />,
  ecommerce: <ShoppingCart className="h-4 w-4" />,
  seo: <Globe className="h-4 w-4" />,
  automation: <Zap className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
};

export function MarketplaceSidebar({ categories, selectedCategory }: MarketplaceSidebarProps) {
  return (
    <div className="w-64 shrink-0 space-y-4">
      {/* Quick Links */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <Link
            href="/dashboard/modules/subscriptions"
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
          >
            <Package className="h-4 w-4" />
            My Subscriptions
          </Link>
          <Link
            href="/dashboard/modules/pricing"
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
          >
            <Settings className="h-4 w-4" />
            Pricing Settings
          </Link>
          <Link
            href="/dashboard/modules/requests/new"
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
          >
            <Zap className="h-4 w-4" />
            Request Module
          </Link>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <Link
            href="/marketplace"
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
              !selectedCategory 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-muted"
            )}
          >
            <Package className="h-4 w-4" />
            All Modules
          </Link>
          
          {categories.map((category) => (
            <Link
              key={category}
              href={`/marketplace?category=${encodeURIComponent(category)}`}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors capitalize",
                selectedCategory === category 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted"
              )}
            >
              {categoryIcons[category.toLowerCase()] || <Package className="h-4 w-4" />}
              {category}
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Install Levels Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Module Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="shrink-0 text-purple-600">Agency</Badge>
            <span>Tools for running your agency</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="shrink-0 text-blue-600">Client</Badge>
            <span>Apps for clients (no site needed)</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="shrink-0 text-green-600">Site</Badge>
            <span>Website enhancements</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
