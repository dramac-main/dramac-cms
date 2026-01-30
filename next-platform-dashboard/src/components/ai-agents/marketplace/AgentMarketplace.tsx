/**
 * Agent Marketplace - Main Component
 * 
 * Phase EM-58B: Browse and install pre-built AI agents
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Star, Download, Crown } from 'lucide-react';

interface MarketplaceAgent {
  id: string;
  templateId: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  icon: string;
  authorName: string;
  authorVerified: boolean;
  pricingType: 'free' | 'one_time' | 'subscription';
  priceMonthly?: number;
  priceOneTime?: number;
  installs: number;
  rating: number;
  ratingCount: number;
  isPremium?: boolean;
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'sales', label: 'Sales' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'support', label: 'Support' },
  { id: 'customer-success', label: 'Customer Success' },
  { id: 'operations', label: 'Operations' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'scheduling', label: 'Scheduling' },
  { id: 'security', label: 'Security' },
];

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name A-Z' },
];

// Mock data - in production this would come from the API
const MOCK_AGENTS: MarketplaceAgent[] = [
  {
    id: '1',
    templateId: 'lead-qualifier',
    name: 'Lead Qualifier',
    description: 'Automatically qualifies and scores new leads based on your ICP',
    category: 'sales',
    tags: ['leads', 'qualification', 'scoring'],
    icon: '🎯',
    authorName: 'DRAMAC',
    authorVerified: true,
    pricingType: 'free',
    installs: 1250,
    rating: 4.8,
    ratingCount: 89,
  },
  {
    id: '2',
    templateId: 'customer-health-monitor',
    name: 'Customer Health Monitor',
    description: 'Monitors customer engagement and predicts churn risk',
    category: 'customer-success',
    tags: ['health', 'churn', 'monitoring'],
    icon: '💚',
    authorName: 'DRAMAC',
    authorVerified: true,
    pricingType: 'free',
    installs: 890,
    rating: 4.7,
    ratingCount: 56,
  },
  {
    id: '3',
    templateId: 'support-triage',
    name: 'Support Triage',
    description: 'Automatically categorizes, prioritizes, and routes support tickets',
    category: 'support',
    tags: ['tickets', 'triage', 'routing'],
    icon: '🎫',
    authorName: 'DRAMAC',
    authorVerified: true,
    pricingType: 'free',
    installs: 2100,
    rating: 4.9,
    ratingCount: 142,
  },
  {
    id: '4',
    templateId: 'sdr-agent',
    name: 'SDR Agent',
    description: 'AI Sales Development Rep that researches prospects and drafts personalized outreach',
    category: 'sales',
    tags: ['outreach', 'prospecting', 'email'],
    icon: '📞',
    authorName: 'DRAMAC',
    authorVerified: true,
    pricingType: 'subscription',
    priceMonthly: 29,
    installs: 450,
    rating: 4.6,
    ratingCount: 28,
    isPremium: true,
  },
  {
    id: '5',
    templateId: 'report-generator',
    name: 'Report Generator',
    description: 'Creates comprehensive reports from your data automatically',
    category: 'analytics',
    tags: ['reports', 'analytics', 'automation'],
    icon: '📊',
    authorName: 'DRAMAC',
    authorVerified: true,
    pricingType: 'free',
    installs: 780,
    rating: 4.5,
    ratingCount: 45,
  },
  {
    id: '6',
    templateId: 'security-guardian',
    name: 'Security Guardian',
    description: 'Monitors for security threats and suspicious activity',
    category: 'security',
    tags: ['security', 'monitoring', 'threats'],
    icon: '🔒',
    authorName: 'DRAMAC',
    authorVerified: true,
    pricingType: 'subscription',
    priceMonthly: 49,
    installs: 320,
    rating: 4.9,
    ratingCount: 18,
    isPremium: true,
  },
];

interface AgentMarketplaceProps {
  siteId: string;
  onInstall: (agentId: string) => Promise<void>;
  onViewDetails: (agentId: string) => void;
}

export function AgentMarketplace({ 
  siteId: _siteId, 
  onInstall, 
  onViewDetails 
}: AgentMarketplaceProps) {
  const [agents, setAgents] = useState<MarketplaceAgent[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'newest' | 'name'>('popular');
  const [isLoading, setIsLoading] = useState(true);
  const [installingId, setInstallingId] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API fetch
    const fetchAgents = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setAgents(MOCK_AGENTS);
      setIsLoading(false);
    };
    
    fetchAgents();
  }, [category, sortBy]);

  const filteredAgents = agents.filter(agent => {
    if (search && !agent.name.toLowerCase().includes(search.toLowerCase()) &&
        !agent.description.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (category !== 'all' && agent.category !== category) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.installs - a.installs;
      case 'rating':
        return b.rating - a.rating;
      case 'newest':
        return 0; // Would use created_at in production
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const handleInstall = useCallback(async (agentId: string) => {
    setInstallingId(agentId);
    try {
      await onInstall(agentId);
    } finally {
      setInstallingId(null);
    }
  }, [onInstall]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Agent Marketplace</h2>
        <p className="text-muted-foreground">
          Browse and install pre-built AI agents for your site
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.id}
            size="sm"
            variant={category === cat.id ? 'default' : 'outline'}
            onClick={() => setCategory(cat.id)}
            className="whitespace-nowrap"
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Agent Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-4 w-3/4 mt-2" />
                <Skeleton className="h-3 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => (
            <Card key={agent.id} className="flex flex-col hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <div className="text-4xl relative">
                    {agent.icon}
                    {agent.isPremium && (
                      <Crown className="absolute -top-1 -right-1 h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{agent.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {agent.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 pb-2">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{agent.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">
                      ({agent.ratingCount})
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Download className="h-4 w-4" />
                    <span>{agent.installs.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-3">
                  <Badge variant="secondary">{agent.category}</Badge>
                  {agent.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                  <span>by {agent.authorName}</span>
                  {agent.authorVerified && (
                    <Badge variant="secondary" className="text-xs px-1">
                      ✓
                    </Badge>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="flex items-center justify-between border-t pt-4">
                <div>
                  {agent.pricingType === 'free' ? (
                    <span className="font-semibold text-green-600">Free</span>
                  ) : agent.pricingType === 'subscription' ? (
                    <span className="font-semibold">
                      ${agent.priceMonthly}/mo
                    </span>
                  ) : (
                    <span className="font-semibold">
                      ${agent.priceOneTime}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(agent.id)}
                  >
                    Details
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleInstall(agent.id)}
                    disabled={installingId === agent.id}
                  >
                    {installingId === agent.id ? 'Installing...' : 'Install'}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="font-semibold mb-2">No agents found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
}
