"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DomainFilters, DomainStatus } from "@/types/domain";

interface DomainFiltersProps {
  filters: DomainFilters;
  onFiltersChange: (filters: DomainFilters) => void;
  tldOptions?: string[];
  className?: string;
}

const STATUS_OPTIONS: { value: DomainStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'expired', label: 'Expired' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'cancelled', label: 'Cancelled' },
];

const EXPIRY_OPTIONS = [
  { value: '', label: 'Any Expiry' },
  { value: '7', label: 'Expiring in 7 days' },
  { value: '30', label: 'Expiring in 30 days' },
  { value: '90', label: 'Expiring in 90 days' },
];

export function DomainFiltersComponent({
  filters,
  onFiltersChange,
  tldOptions = ['.com', '.net', '.org', '.io', '.co', '.app', '.dev'],
  className,
}: DomainFiltersProps) {
  const activeFilterCount = [
    filters.status && filters.status !== 'all',
    filters.tld,
    filters.expiringWithinDays,
    filters.hasEmail,
    filters.hasCloudflare,
  ].filter(Boolean).length;

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: value as DomainStatus | 'all' });
  };

  const handleTldChange = (value: string) => {
    onFiltersChange({ ...filters, tld: value || undefined });
  };

  const handleExpiryChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      expiringWithinDays: value ? parseInt(value) : undefined 
    });
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-') as [typeof filters.sortBy, typeof filters.sortOrder];
    onFiltersChange({ ...filters, sortBy, sortOrder });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      tld: undefined,
      expiringWithinDays: undefined,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search domains..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select 
          value={`${filters.sortBy || 'created_at'}-${filters.sortOrder || 'desc'}`} 
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at-desc">Newest First</SelectItem>
            <SelectItem value="created_at-asc">Oldest First</SelectItem>
            <SelectItem value="domain_name-asc">Domain (A-Z)</SelectItem>
            <SelectItem value="domain_name-desc">Domain (Z-A)</SelectItem>
            <SelectItem value="expiry_date-asc">Expiring Soon</SelectItem>
            <SelectItem value="expiry_date-desc">Expiring Latest</SelectItem>
          </SelectContent>
        </Select>

        {/* More Filters */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">TLD Extension</label>
                <Select value={filters.tld || ''} onValueChange={handleTldChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All extensions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Extensions</SelectItem>
                    {tldOptions.map(tld => (
                      <SelectItem key={tld} value={tld}>
                        {tld}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Expiry Period</label>
                <Select 
                  value={filters.expiringWithinDays?.toString() || ''} 
                  onValueChange={handleExpiryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any expiry date" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeFilterCount > 0 && (
                <Button 
                  variant="ghost" 
                  className="w-full" 
                  onClick={clearFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.status && filters.status !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.status}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleStatusChange('all')} 
              />
            </Badge>
          )}
          {filters.tld && (
            <Badge variant="secondary" className="gap-1">
              TLD: {filters.tld}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleTldChange('')} 
              />
            </Badge>
          )}
          {filters.expiringWithinDays && (
            <Badge variant="secondary" className="gap-1">
              Expiring in {filters.expiringWithinDays} days
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleExpiryChange('')} 
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
