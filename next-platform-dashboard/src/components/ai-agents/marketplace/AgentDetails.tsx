/**
 * Agent Details Modal
 * 
 * Phase EM-58B: Detailed view of a marketplace agent
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Star, 
  Download, 
  CircleCheck, 
  Zap, 
  Wrench, 
  Shield,
  Crown,
  User
} from 'lucide-react';

interface AgentDetailsProps {
  agent: {
    id: string;
    name: string;
    description: string;
    longDescription?: string;
    category: string;
    tags: string[];
    icon: string;
    authorName: string;
    authorVerified: boolean;
    pricingType: 'free' | 'one_time' | 'subscription';
    priceMonthly?: number;
    installs: number;
    rating: number;
    ratingCount: number;
    isPremium?: boolean;
    screenshots?: string[];
    requirements?: string[];
    triggers?: string[];
    tools?: string[];
    constraints?: string[];
    version?: string;
    updatedAt?: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstall: (agentId: string) => Promise<void>;
}

interface Review {
  id: string;
  userName: string;
  rating: number;
  title: string;
  content: string;
  createdAt: string;
  isVerified: boolean;
}

const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    userName: 'Sarah M.',
    rating: 5,
    title: 'Exactly what we needed!',
    content: 'This agent has saved us hours every week. Setup was easy and it started working immediately.',
    createdAt: '2026-01-15',
    isVerified: true,
  },
  {
    id: '2',
    userName: 'John D.',
    rating: 4,
    title: 'Great but could use more customization',
    content: 'Works well out of the box. Would love to see more trigger options in the future.',
    createdAt: '2026-01-10',
    isVerified: true,
  },
];

export function AgentDetails({ 
  agent, 
  open, 
  onOpenChange, 
  onInstall 
}: AgentDetailsProps) {
  const [isInstalling, setIsInstalling] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  if (!agent) return null;

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await onInstall(agent.id);
      onOpenChange(false);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="text-5xl relative">
              {agent.icon}
              {agent.isPremium && (
                <Crown className="absolute -top-1 -right-1 h-5 w-5 text-amber-500" />
              )}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{agent.name}</DialogTitle>
              <DialogDescription className="mt-1">
                {agent.description}
              </DialogDescription>
              
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{agent.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground text-sm">
                    ({agent.ratingCount} reviews)
                  </span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Download className="h-4 w-4" />
                  <span>{agent.installs.toLocaleString()} installs</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{agent.category}</Badge>
                {agent.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="text-right">
              <div className="mb-2">
                {agent.pricingType === 'free' ? (
                  <span className="text-2xl font-bold text-green-600">Free</span>
                ) : (
                  <div>
                    <span className="text-2xl font-bold">${agent.priceMonthly}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                )}
              </div>
              <Button 
                onClick={handleInstall}
                disabled={isInstalling}
                className="w-full"
              >
                {isInstalling ? 'Installing...' : 'Install Agent'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-6">
            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">About this Agent</h3>
              <p className="text-muted-foreground whitespace-pre-line">
                {agent.longDescription || agent.description}
              </p>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <div className="font-medium">
                    {agent.triggers?.length || 3} Triggers
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Automatic activation
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Wrench className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <div className="font-medium">
                    {agent.tools?.length || 5} Tools
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Built-in capabilities
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <div className="font-medium">
                    {agent.constraints?.length || 4} Rules
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Safety constraints
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Author */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{agent.authorName}</span>
                    {agent.authorVerified && (
                      <Badge variant="secondary" className="text-xs">
                        <CircleCheck className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Publisher</p>
                </div>
              </div>
              {agent.version && (
                <div className="text-right">
                  <div className="text-sm font-medium">v{agent.version}</div>
                  <div className="text-xs text-muted-foreground">
                    Updated {agent.updatedAt}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="details" className="mt-4 space-y-6">
            {/* Triggers */}
            {agent.triggers && agent.triggers.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Triggers
                </h3>
                <div className="flex flex-wrap gap-2">
                  {agent.triggers.map((trigger) => (
                    <Badge key={trigger} variant="outline">
                      {trigger}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Tools */}
            {agent.tools && agent.tools.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Tools Used
                </h3>
                <div className="flex flex-wrap gap-2">
                  {agent.tools.map((tool) => (
                    <Badge key={tool} variant="secondary">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            {agent.requirements && agent.requirements.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Requirements</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {agent.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-4 space-y-6">
            {/* Rating Summary */}
            <div className="flex items-center gap-6 p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <div className="text-4xl font-bold">{agent.rating.toFixed(1)}</div>
                <div className="flex gap-0.5 justify-center mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(agent.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {agent.ratingCount} reviews
                </p>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {MOCK_REVIEWS.map((review) => (
                <Card key={review.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{review.userName}</span>
                          {review.isVerified && (
                            <Badge variant="secondary" className="text-xs">
                              Verified Install
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
                                  star <= review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {review.createdAt}
                          </span>
                        </div>
                      </div>
                    </div>
                    <h4 className="font-medium text-sm">{review.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {review.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
