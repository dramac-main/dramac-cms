'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Download, ArrowRight, Check, Sparkles, FlaskConical, Building2, Users, Globe, Package } from 'lucide-react';
import { MODULE_CATEGORIES } from '@/lib/modules/module-categories';
import { formatCurrency } from '@/lib/locale-config';
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
 * Get install level icon and color
 */
function getInstallLevelBadge(level: string | null | undefined) {
  switch (level) {
    case 'agency':
      return { icon: <Building2 className="h-3 w-3" />, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30', label: 'Agency' };
    case 'client':
      return { icon: <Users className="h-3 w-3" />, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30', label: 'Client' };
    case 'site':
      return { icon: <Globe className="h-3 w-3" />, color: 'text-green-600 bg-green-100 dark:bg-green-900/30', label: 'Site' };
    default:
      return { icon: <Package className="h-3 w-3" />, color: '', label: level || 'Module' };
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
    <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden h-full flex flex-col">
      <CardContent className="p-4 flex-1">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="text-4xl shrink-0">{module.icon || '📦'}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold truncate">{module.name}</h3>
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

        {/* Badges Row: Install Level, Studio, Beta, Featured */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {/* Install Level Badge */}
          {module.install_level && (
            <Badge 
              variant="outline" 
              className={`text-xs ${installLevelBadge.color}`}
            >
              {installLevelBadge.icon}
              <span className="ml-1">{installLevelBadge.label}</span>
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
            <Badge 
              variant="outline" 
              className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700"
            >
              <FlaskConical className="h-3 w-3 mr-1" />
              Beta
            </Badge>
          )}
          
          {/* Featured Badge */}
          {module.is_featured && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              Featured
            </Badge>
          )}
          
          {/* Category Badge */}
          {category && (
            <Badge 
              variant="outline" 
              className="text-xs"
              style={{ borderColor: category.color, color: category.color }}
            >
              {category.label}
            </Badge>
          )}
        </div>

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
            variant="outline" 
            className="transition-all duration-200 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary"
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
