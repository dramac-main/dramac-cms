'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Download, ArrowRight, Check, Sparkles } from 'lucide-react';
import { MODULE_CATEGORIES } from '@/lib/modules/module-categories';
import type { ModuleListItem } from '@/lib/modules/marketplace-search';

interface EnhancedModuleCardProps {
  module: ModuleListItem;
  isSubscribed?: boolean;
  showActions?: boolean;
  linkPrefix?: string;
}

/**
 * Format price in cents to display string
 */
function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return 'Free';
  return `$${(cents / 100).toFixed(2)}`;
}

export function EnhancedModuleCard({ 
  module, 
  isSubscribed = false,
  showActions = true,
  linkPrefix = '/marketplace'
}: EnhancedModuleCardProps) {
  const category = MODULE_CATEGORIES[module.category as keyof typeof MODULE_CATEGORIES];
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden h-full flex flex-col">
      <CardContent className="p-4 flex-1">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="text-4xl shrink-0">{module.icon || '📦'}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold truncate">{module.name}</h3>
              {module.is_featured && (
                <Badge variant="secondary" className="shrink-0 gap-1">
                  <Sparkles className="h-3 w-3" />
                  Featured
                </Badge>
              )}
              {isSubscribed && (
                <Badge className="shrink-0 bg-green-500 hover:bg-green-600 gap-1">
                  <Check className="h-3 w-3" />
                  Subscribed
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              by {module.author_name || 'Unknown'}
              {module.author_verified && (
                <span className="ml-1 text-blue-500" title="Verified Author">✓</span>
              )}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
          {module.description || 'No description available'}
        </p>

        {/* Category Badge */}
        {category && (
          <Badge 
            variant="outline" 
            className="mt-3"
            style={{ borderColor: category.color, color: category.color }}
          >
            {category.label}
          </Badge>
        )}

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          {module.rating_average !== null && module.rating_average > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{module.rating_average.toFixed(1)}</span>
              <span className="text-xs">({module.rating_count || 0})</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span>{(module.install_count || 0).toLocaleString()}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between border-t mt-auto">
        {/* Price */}
        <div className="font-semibold">
          {module.pricing_type === 'free' ? (
            <span className="text-green-600">Free</span>
          ) : (
            <span>
              {formatPrice(module.wholesale_price_monthly)}/mo
            </span>
          )}
        </div>

        {/* Action */}
        {showActions && (
          <Button 
            asChild 
            size="sm" 
            variant="ghost" 
            className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          >
            <Link href={`${linkPrefix}/${module.slug}`}>
              View
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
