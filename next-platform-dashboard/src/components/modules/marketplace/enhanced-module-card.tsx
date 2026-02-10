'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Download, ArrowRight, Check, Sparkles, FlaskConical, Building2, Users, Globe, Package } from 'lucide-react';
import { MODULE_CATEGORIES } from '@/lib/modules/module-categories';
import { formatCurrency } from '@/lib/locale-config';
import { ModuleIconContainer } from '@/components/modules/shared/module-icon-container';
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
  return formatCurrency(cents / 100);
}

/**
 * Get install level icon and label
 */
function getInstallLevelBadge(level: string | null | undefined) {
  switch (level) {
    case 'agency':
      return { icon: <Building2 className="h-3 w-3" />, label: 'Agency' };
    case 'client':
      return { icon: <Users className="h-3 w-3" />, label: 'Client' };
    case 'site':
      return { icon: <Globe className="h-3 w-3" />, label: 'Site' };
    default:
      return { icon: <Package className="h-3 w-3" />, label: level || 'Module' };
  }
}

export function EnhancedModuleCard({ 
  module, 
  isSubscribed = false,
  showActions = true,
  linkPrefix = '/marketplace'
}: EnhancedModuleCardProps) {
  const category = MODULE_CATEGORIES[module.category as keyof typeof MODULE_CATEGORIES];
  const isStudioModule = module.source === 'studio';
  const isBetaModule = module.status === 'testing';
  const installLevelBadge = getInstallLevelBadge(module.install_level);
  
  return (
    <Card className="group hover:shadow-md hover:border-primary/30 transition-all duration-300 overflow-hidden h-full flex flex-col">
      <CardContent className="p-4 flex-1">
        {/* Header */}
        <div className="flex items-start gap-3">
          <ModuleIconContainer
            icon={module.icon}
            category={module.category}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold truncate">{module.name}</h3>
              {isSubscribed && (
                <Badge variant="secondary" className="shrink-0 gap-1 text-xs">
                  <Check className="h-3 w-3" />
                  Subscribed
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              by {module.author_name || 'Unknown'}
              {module.author_verified && (
                <span className="ml-1 text-muted-foreground/70" title="Verified Author">✓</span>
              )}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
          {module.description || 'No description available'}
        </p>

        {/* Badges Row */}
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          {/* Install Level Badge */}
          {module.install_level && (
            <Badge variant="outline" className="text-xs text-muted-foreground gap-1">
              {installLevelBadge.icon}
              {installLevelBadge.label}
            </Badge>
          )}
          
          {/* Studio Badge */}
          {isStudioModule && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              Studio
            </Badge>
          )}
          
          {/* Beta Badge */}
          {isBetaModule && (
            <Badge variant="outline" className="text-xs gap-1">
              <FlaskConical className="h-3 w-3" />
              Beta
            </Badge>
          )}
          
          {/* Featured Badge */}
          {module.is_featured && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Star className="h-3 w-3 fill-current" />
              Featured
            </Badge>
          )}
          
          {/* Category Badge */}
          {category && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {category.label}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          {module.rating_average !== null && module.rating_average > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
              <span className="text-foreground font-medium">{module.rating_average.toFixed(1)}</span>
              <span className="text-xs">({module.rating_count || 0})</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5" />
            <span>{(module.install_count || 0).toLocaleString()}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between border-t mt-auto">
        {/* Price */}
        <div className="font-semibold text-sm">
          {module.pricing_type === 'free' ? (
            <span className="text-muted-foreground">Free</span>
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
            className="transition-all duration-200 group-hover:bg-primary group-hover:text-primary-foreground"
          >
            <Link href={`${linkPrefix}/${module.slug}`}>
              View
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
