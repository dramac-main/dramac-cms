"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, Sparkles, Zap, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface MarketplaceHeaderProps {
  searchQuery?: string;
}

export function MarketplaceHeader({ searchQuery }: MarketplaceHeaderProps) {
  const router = useRouter();
  const [search, setSearch] = useState(searchQuery || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/marketplace?q=${encodeURIComponent(search.trim())}`);
    } else {
      router.push("/marketplace");
    }
  };

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-xl p-8">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 max-w-2xl">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Package className="h-8 w-8" />
            Module Marketplace
          </h1>
          <p className="text-muted-foreground mb-6">
            Discover powerful modules to enhance your clients' experience. 
            Subscribe at wholesale prices and set your own markup.
          </p>
          
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search modules..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Set your own markup
            </span>
            <span>•</span>
            <span>Client-level & Site-level modules</span>
            <span>•</span>
            <span>Instant activation</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="hidden lg:flex flex-col gap-2">
          <Button asChild className="justify-start">
            <Link href="/dashboard/modules/requests/new">
              <Zap className="h-4 w-4 mr-2" />
              Request a Module
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link href="/dashboard/modules/subscriptions">
              <BookOpen className="h-4 w-4 mr-2" />
              My Subscriptions
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
