/**
 * Agent Analytics Dashboard
 * 
 * Phase EM-58B: Comprehensive analytics for AI agent performance
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Bot,
  TrendingUp,
  Clock,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  RefreshCw,
  Download
} from 'lucide-react';

interface AgentStats {
  totalExecutions: number;
  successRate: number;
  avgDuration: number;
  totalTokens: number;
  totalCost: number;
  activeAgents: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
}

interface ExecutionRecord {
  id: string;
  agentId: string;
  agentName: string;
  triggeredBy: string;
  status: 'success' | 'failed' | 'timeout' | 'pending_approval';
  duration: number;
  tokensUsed: number;
  cost: number;
  timestamp: string;
  errorMessage?: string;
}

interface AgentPerformance {
  id: string;
  name: string;
  executions: number;
  successRate: number;
  avgDuration: number;
  totalCost: number;
  lastRun: string;
}

const TIME_RANGES = [
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
];

// Mock data - in production this comes from API
const MOCK_STATS: AgentStats = {
  totalExecutions: 1247,
  successRate: 94.2,
  avgDuration: 2.3,
  totalTokens: 892450,
  totalCost: 4.46,
  activeAgents: 5,
  trend: 'up',
  trendPercent: 12.5,
};

const MOCK_EXECUTIONS: ExecutionRecord[] = [
  {
    id: '1',
    agentId: 'agent-1',
    agentName: 'Lead Qualifier',
    triggeredBy: 'New CRM Contact',
    status: 'success',
    duration: 1.8,
    tokensUsed: 450,
    cost: 0.0045,
    timestamp: '2026-01-24T10:30:00Z',
  },
  {
    id: '2',
    agentId: 'agent-2',
    agentName: 'Support Triage',
    triggeredBy: 'New Ticket',
    status: 'success',
    duration: 2.1,
    tokensUsed: 620,
    cost: 0.0062,
    timestamp: '2026-01-24T10:25:00Z',
  },
  {
    id: '3',
    agentId: 'agent-1',
    agentName: 'Lead Qualifier',
    triggeredBy: 'New CRM Contact',
    status: 'pending_approval',
    duration: 0,
    tokensUsed: 380,
    cost: 0.0038,
    timestamp: '2026-01-24T10:20:00Z',
  },
  {
    id: '4',
    agentId: 'agent-3',
    agentName: 'Data Cleaner',
    triggeredBy: 'Scheduled',
    status: 'failed',
    duration: 5.2,
    tokensUsed: 890,
    cost: 0.0089,
    timestamp: '2026-01-24T10:15:00Z',
    errorMessage: 'Rate limit exceeded',
  },
  {
    id: '5',
    agentId: 'agent-4',
    agentName: 'Report Generator',
    triggeredBy: 'Weekly Schedule',
    status: 'success',
    duration: 8.4,
    tokensUsed: 2100,
    cost: 0.021,
    timestamp: '2026-01-24T10:00:00Z',
  },
];

const MOCK_PERFORMANCE: AgentPerformance[] = [
  {
    id: 'agent-1',
    name: 'Lead Qualifier',
    executions: 423,
    successRate: 96.5,
    avgDuration: 1.9,
    totalCost: 1.52,
    lastRun: '5 mins ago',
  },
  {
    id: 'agent-2',
    name: 'Support Triage',
    executions: 312,
    successRate: 98.1,
    avgDuration: 2.4,
    totalCost: 1.12,
    lastRun: '10 mins ago',
  },
  {
    id: 'agent-3',
    name: 'Data Cleaner',
    executions: 156,
    successRate: 87.2,
    avgDuration: 5.1,
    totalCost: 0.89,
    lastRun: '15 mins ago',
  },
  {
    id: 'agent-4',
    name: 'Report Generator',
    executions: 52,
    successRate: 100,
    avgDuration: 8.2,
    totalCost: 0.93,
    lastRun: '1 hour ago',
  },
];

interface AgentAnalyticsProps {
  siteId: string;
  onAgentClick?: (agentId: string) => void;
}

export function AgentAnalytics({ siteId: _siteId, onAgentClick }: AgentAnalyticsProps) {
  const [timeRange, setTimeRange] = useState('7d');
  const [stats, _setStats] = useState<AgentStats>(MOCK_STATS);
  const [executions, _setExecutions] = useState<ExecutionRecord[]>(MOCK_EXECUTIONS);
  const [performance, _setPerformance] = useState<AgentPerformance[]>(MOCK_PERFORMANCE);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      // In production, fetch real data here
      await new Promise(resolve => setTimeout(resolve, 500));
      if (isMounted) {
        setIsLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [timeRange]);

  const refreshData = async () => {
    setIsLoading(true);
    // In production, fetch real data here
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  };

  const formatCost = (cost: number) => {
    if (cost < 0.01) return `$${(cost * 100).toFixed(2)}¢`;
    return `$${cost.toFixed(4)}`;
  };

  const getStatusBadge = (status: ExecutionRecord['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'timeout':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Timeout</Badge>;
      case 'pending_approval':
        return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Agent Analytics</h2>
          <p className="text-muted-foreground">
            Monitor performance and usage across all AI agents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={refreshData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Zap className="h-5 w-5 text-yellow-500" />
              {stats.trend === 'up' && (
                <span className="text-xs text-green-500 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stats.trendPercent}%
                </span>
              )}
            </div>
            <div className="text-2xl font-bold mt-2">
              {stats.totalExecutions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total Executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div className="text-2xl font-bold mt-2">
              {stats.successRate}%
            </div>
            <p className="text-xs text-muted-foreground">Success Rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <Clock className="h-5 w-5 text-blue-500" />
            <div className="text-2xl font-bold mt-2">
              {stats.avgDuration}s
            </div>
            <p className="text-xs text-muted-foreground">Avg Duration</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <Bot className="h-5 w-5 text-purple-500" />
            <div className="text-2xl font-bold mt-2">
              {stats.activeAgents}
            </div>
            <p className="text-xs text-muted-foreground">Active Agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <Zap className="h-5 w-5 text-orange-500" />
            <div className="text-2xl font-bold mt-2">
              {(stats.totalTokens / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground">Tokens Used</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <DollarSign className="h-5 w-5 text-green-500" />
            <div className="text-2xl font-bold mt-2">
              ${stats.totalCost.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Total Cost</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="executions">
        <TabsList>
          <TabsTrigger value="executions">Recent Executions</TabsTrigger>
          <TabsTrigger value="performance">Agent Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="executions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>
                Recent agent executions and their outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Triggered By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.map((exec) => (
                    <TableRow 
                      key={exec.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onAgentClick?.(exec.agentId)}
                    >
                      <TableCell className="font-medium">
                        {exec.agentName}
                      </TableCell>
                      <TableCell>{exec.triggeredBy}</TableCell>
                      <TableCell>
                        {getStatusBadge(exec.status)}
                        {exec.errorMessage && (
                          <p className="text-xs text-destructive mt-1">
                            {exec.errorMessage}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {exec.status === 'pending_approval' 
                          ? '-' 
                          : formatDuration(exec.duration)}
                      </TableCell>
                      <TableCell>{exec.tokensUsed.toLocaleString()}</TableCell>
                      <TableCell>{formatCost(exec.cost)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(exec.timestamp).toLocaleTimeString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
              <CardDescription>
                Compare performance across all active agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {performance.map((agent) => (
                  <div 
                    key={agent.id}
                    className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onAgentClick?.(agent.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{agent.name}</h4>
                        <span className="text-sm text-muted-foreground">
                          {agent.lastRun}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Executions</span>
                          <p className="font-medium">{agent.executions}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Success Rate</span>
                          <p className="font-medium">{agent.successRate}%</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Avg Duration</span>
                          <p className="font-medium">{agent.avgDuration}s</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Cost</span>
                          <p className="font-medium">${agent.totalCost.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress value={agent.successRate} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
