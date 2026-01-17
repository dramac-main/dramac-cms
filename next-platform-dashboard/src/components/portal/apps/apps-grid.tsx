"use client";

import Link from "next/link";
import { AppCard } from "./app-card";

interface Module {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  slug: string;
  category: string;
  installation_id: string;
  installed_at: string;
  settings: Record<string, unknown>;
  custom_name: string | null;
  custom_icon: string | null;
}

interface AppsGridProps {
  modules: Module[];
  basePath?: string;
}

export function AppsGrid({ modules, basePath = "/portal/apps" }: AppsGridProps) {
  // Group by category
  const categories = modules.reduce((acc, module) => {
    const cat = module.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(module);
    return acc;
  }, {} as Record<string, Module[]>);

  // Sort categories alphabetically but put "Other" last
  const sortedCategories = Object.keys(categories).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-8">
      {sortedCategories.map((category) => (
        <section key={category}>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground capitalize">
            {category}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {categories[category].map((module) => (
              <Link 
                key={module.installation_id} 
                href={`${basePath}/${module.slug || module.id}`}
              >
                <AppCard module={module} />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
