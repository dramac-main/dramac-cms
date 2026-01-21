'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Sparkles, TrendingUp, Clock, Star, Gift, Building2 } from 'lucide-react';
import { getFeaturedCollections, type ModuleCollection } from '@/lib/modules/marketplace-search';
import { EnhancedModuleCard } from './enhanced-module-card';

interface FeaturedCollectionsProps {
  subscribedModuleIds?: Set<string>;
  maxCollections?: number;
  maxModulesPerCollection?: number;
}

const COLLECTION_ICONS: Record<string, React.ReactNode> = {
  'featured': <Sparkles className="h-5 w-5" />,
  'new-releases': <Clock className="h-5 w-5" />,
  'top-rated': <Star className="h-5 w-5" />,
  'most-popular': <TrendingUp className="h-5 w-5" />,
  'free-essentials': <Gift className="h-5 w-5" />,
  'enterprise-suite': <Building2 className="h-5 w-5" />,
};

export function FeaturedCollections({ 
  subscribedModuleIds = new Set(),
  maxCollections = 6,
  maxModulesPerCollection = 4
}: FeaturedCollectionsProps) {
  const [collections, setCollections] = useState<ModuleCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCollections() {
      try {
        const data = await getFeaturedCollections();
        setCollections(data.slice(0, maxCollections));
      } catch (err) {
        console.error('Error loading collections:', err);
        setError('Failed to load collections');
      } finally {
        setLoading(false);
      }
    }
    
    loadCollections();
  }, [maxCollections]);

  if (loading) {
    return (
      <div className="space-y-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((j) => (
                <Skeleton key={j} className="h-64 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </Card>
    );
  }

  if (collections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-10">
      {collections.map((collection) => {
        const modules = collection.items
          .map(item => item.module)
          .filter(Boolean)
          .slice(0, maxModulesPerCollection);
        
        if (modules.length === 0) return null;

        const Icon = COLLECTION_ICONS[collection.slug] || <Sparkles className="h-5 w-5" />;

        return (
          <section key={collection.id}>
            {/* Collection Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{collection.icon}</span>
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    {Icon}
                    {collection.name}
                  </h2>
                  {collection.description && (
                    <p className="text-sm text-muted-foreground">
                      {collection.description}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="ghost" asChild>
                <Link href={`/marketplace/collections/${collection.slug}`}>
                  View All
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Collection Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {modules.map((module) => (
                <EnhancedModuleCard
                  key={module.id}
                  module={module}
                  isSubscribed={subscribedModuleIds.has(module.id)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/**
 * Single collection display component
 */
interface CollectionSectionProps {
  collection: ModuleCollection;
  subscribedModuleIds?: Set<string>;
  maxModules?: number;
}

export function CollectionSection({ 
  collection, 
  subscribedModuleIds = new Set(),
  maxModules = 4
}: CollectionSectionProps) {
  const modules = collection.items
    .map(item => item.module)
    .filter(Boolean)
    .slice(0, maxModules);

  if (modules.length === 0) return null;

  const Icon = COLLECTION_ICONS[collection.slug] || <Sparkles className="h-5 w-5" />;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">{collection.icon}</span>
            {Icon}
            {collection.name}
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/marketplace/collections/${collection.slug}`}>
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        {collection.description && (
          <p className="text-sm text-muted-foreground">
            {collection.description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((module) => (
            <EnhancedModuleCard
              key={module.id}
              module={module}
              isSubscribed={subscribedModuleIds.has(module.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
