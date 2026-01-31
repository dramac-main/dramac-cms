"use client";

/**
 * Automation Analytics Dashboard Enhanced
 * 
 * PHASE-DS-03C: Automation Analytics Dashboard
 * Enhanced client dashboard with tabbed interface and comprehensive analytics
 */

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Download, Activity, Workflow, AlertTriangle, Clock, Radio, Layers } from "lucide-react";
import type { AutomationTimeRange } from "@/types/automation-analytics";

// Server Actions
import {
  getExecutionOverview,
  getExecutionTrend,
  getExecutionsByStatus,
  getWorkflowMetrics,
  getWorkflowPerformance,
  getWorkflowsByCategory,
  getWorkflowsByTrigger,
  getStepAnalytics,
  getErrorMetrics,
  getErrorsByType,
  getErrorTrend,
  getRecentErrors,
  getTimingMetrics,
  getExecutionsByHour,
  getExecutionsByDay,
  getDurationDistribution,
  getTriggerMetrics,
  getTriggerTrend,
  getTriggerPerformance,
  getActionsByType,
} from "@/lib/actions/automation-analytics";

// Analytics Components
import {
  ExecutionOverviewCards,
  ExecutionTrendChart,
  ExecutionLineChart,
  ExecutionsByStatusChart,
  ExecutionDurationChart,
  ExecutionSummaryCompact,
  WorkflowMetricsCards,
  WorkflowPerformanceTable,
  WorkflowPerformanceChart,
  WorkflowsByCategoryChart,
  WorkflowsByTriggerChart,
  WorkflowSummaryCompact,
  ErrorMetricsCards,
  ErrorsByTypeChart,
  ErrorsByTypeBarChart,
  ErrorTrendChart,
  RecentErrorsList,
  ErrorSummaryCompact,
  TimingMetricsCards,
  ExecutionsByHourChart,
  ExecutionsByDayChart,
  SuccessRateByDayChart,
  DurationDistributionChart,
  DurationPieChart,
  AvgDurationByHourChart,
  TimingSummaryCompact,
  TriggerMetricsCards,
  TriggerTrendChart,
  TriggerPerformanceTable,
  TriggerDistributionChart,
  StepAnalyticsChart,
  ActionsByTypeChart,
  TriggerSummaryCompact,
} from "@/components/analytics/automation";

interface AutomationAnalyticsDashboardProps {
  siteId: string;
}

export function AutomationAnalyticsDashboardEnhanced({
  siteId,
}: AutomationAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<AutomationTimeRange>("30d");
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Data state
  const [executionOverview, setExecutionOverview] = useState<Awaited<ReturnType<typeof getExecutionOverview>> | null>(null);
  const [executionTrend, setExecutionTrend] = useState<Awaited<ReturnType<typeof getExecutionTrend>> | null>(null);
  const [executionsByStatus, setExecutionsByStatus] = useState<Awaited<ReturnType<typeof getExecutionsByStatus>> | null>(null);
  const [workflowMetrics, setWorkflowMetrics] = useState<Awaited<ReturnType<typeof getWorkflowMetrics>> | null>(null);
  const [workflowPerformance, setWorkflowPerformance] = useState<Awaited<ReturnType<typeof getWorkflowPerformance>> | null>(null);
  const [workflowsByCategory, setWorkflowsByCategory] = useState<Awaited<ReturnType<typeof getWorkflowsByCategory>> | null>(null);
  const [workflowsByTrigger, setWorkflowsByTrigger] = useState<Awaited<ReturnType<typeof getWorkflowsByTrigger>> | null>(null);
  const [stepAnalytics, setStepAnalytics] = useState<Awaited<ReturnType<typeof getStepAnalytics>> | null>(null);
  const [errorMetrics, setErrorMetrics] = useState<Awaited<ReturnType<typeof getErrorMetrics>> | null>(null);
  const [errorsByType, setErrorsByType] = useState<Awaited<ReturnType<typeof getErrorsByType>> | null>(null);
  const [errorTrend, setErrorTrend] = useState<Awaited<ReturnType<typeof getErrorTrend>> | null>(null);
  const [recentErrors, setRecentErrors] = useState<Awaited<ReturnType<typeof getRecentErrors>> | null>(null);
  const [timingMetrics, setTimingMetrics] = useState<Awaited<ReturnType<typeof getTimingMetrics>> | null>(null);
  const [executionsByHour, setExecutionsByHour] = useState<Awaited<ReturnType<typeof getExecutionsByHour>> | null>(null);
  const [executionsByDay, setExecutionsByDay] = useState<Awaited<ReturnType<typeof getExecutionsByDay>> | null>(null);
  const [durationDistribution, setDurationDistribution] = useState<Awaited<ReturnType<typeof getDurationDistribution>> | null>(null);
  const [triggerMetrics, setTriggerMetrics] = useState<Awaited<ReturnType<typeof getTriggerMetrics>> | null>(null);
  const [triggerTrend, setTriggerTrend] = useState<Awaited<ReturnType<typeof getTriggerTrend>> | null>(null);
  const [triggerPerformance, setTriggerPerformance] = useState<Awaited<ReturnType<typeof getTriggerPerformance>> | null>(null);
  const [actionsByType, setActionsByType] = useState<Awaited<ReturnType<typeof getActionsByType>> | null>(null);
  
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        execOverview,
        execTrend,
        execStatus,
        wfMetrics,
        wfPerf,
        wfCategory,
        wfTrigger,
        stepData,
        errMetrics,
        errByType,
        errTrend,
        recentErr,
        timeMetrics,
        execHour,
        execDay,
        durDist,
        trigMetrics,
        trigTrend,
        trigPerf,
        actionTypes,
      ] = await Promise.all([
        getExecutionOverview(siteId, timeRange),
        getExecutionTrend(siteId, timeRange),
        getExecutionsByStatus(siteId, timeRange),
        getWorkflowMetrics(siteId, timeRange),
        getWorkflowPerformance(siteId, timeRange),
        getWorkflowsByCategory(siteId, timeRange),
        getWorkflowsByTrigger(siteId, timeRange),
        getStepAnalytics(siteId, timeRange),
        getErrorMetrics(siteId, timeRange),
        getErrorsByType(siteId, timeRange),
        getErrorTrend(siteId, timeRange),
        getRecentErrors(siteId, timeRange),
        getTimingMetrics(siteId, timeRange),
        getExecutionsByHour(siteId, timeRange),
        getExecutionsByDay(siteId, timeRange),
        getDurationDistribution(siteId, timeRange),
        getTriggerMetrics(siteId, timeRange),
        getTriggerTrend(siteId, timeRange),
        getTriggerPerformance(siteId, timeRange),
        getActionsByType(siteId, timeRange),
      ]);
      
      setExecutionOverview(execOverview);
      setExecutionTrend(execTrend);
      setExecutionsByStatus(execStatus);
      setWorkflowMetrics(wfMetrics);
      setWorkflowPerformance(wfPerf);
      setWorkflowsByCategory(wfCategory);
      setWorkflowsByTrigger(wfTrigger);
      setStepAnalytics(stepData);
      setErrorMetrics(errMetrics);
      setErrorsByType(errByType);
      setErrorTrend(errTrend);
      setRecentErrors(recentErr);
      setTimingMetrics(timeMetrics);
      setExecutionsByHour(execHour);
      setExecutionsByDay(execDay);
      setDurationDistribution(durDist);
      setTriggerMetrics(trigMetrics);
      setTriggerTrend(trigTrend);
      setTriggerPerformance(trigPerf);
      setActionsByType(actionTypes);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch automation analytics:", error);
    } finally {
      setIsLoading(false);
    }
  }, [siteId, timeRange]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleExport = () => {
    // Export analytics data as JSON
    const exportData = {
      timeRange,
      exportedAt: new Date().toISOString(),
      executionOverview,
      workflowMetrics,
      errorMetrics,
      timingMetrics,
      triggerMetrics,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `automation-analytics-${siteId}-${timeRange}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Automation Analytics</h2>
          <p className="text-muted-foreground">
            Monitor workflow performance and execution metrics
            {lastUpdated && (
              <span className="ml-2 text-xs">
                • Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as AutomationTimeRange)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          
          <Button variant="outline" size="icon" onClick={handleExport}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 h-auto">
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="workflows" className="gap-2">
            <Workflow className="h-4 w-4" />
            <span className="hidden sm:inline">Workflows</span>
          </TabsTrigger>
          <TabsTrigger value="errors" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Errors</span>
          </TabsTrigger>
          <TabsTrigger value="timing" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Timing</span>
          </TabsTrigger>
          <TabsTrigger value="triggers" className="gap-2">
            <Radio className="h-4 w-4" />
            <span className="hidden sm:inline">Triggers</span>
          </TabsTrigger>
          <TabsTrigger value="steps" className="gap-2">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Steps</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {executionOverview && (
            <ExecutionOverviewCards data={executionOverview} />
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {executionTrend && <ExecutionTrendChart data={executionTrend} />}
            {executionsByStatus && <ExecutionsByStatusChart data={executionsByStatus} />}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {executionOverview && <ExecutionSummaryCompact data={executionOverview} />}
            {workflowMetrics && workflowPerformance && (
              <WorkflowSummaryCompact metrics={workflowMetrics} topWorkflows={workflowPerformance} />
            )}
            {errorMetrics && <ErrorSummaryCompact data={errorMetrics} />}
          </div>
        </TabsContent>
        
        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          {workflowMetrics && <WorkflowMetricsCards data={workflowMetrics} />}
          
          {workflowPerformance && (
            <WorkflowPerformanceTable data={workflowPerformance} />
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {workflowPerformance && <WorkflowPerformanceChart data={workflowPerformance} />}
            {workflowsByCategory && <WorkflowsByCategoryChart data={workflowsByCategory} />}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {workflowsByTrigger && <WorkflowsByTriggerChart data={workflowsByTrigger} />}
            {workflowMetrics && workflowPerformance && (
              <WorkflowSummaryCompact metrics={workflowMetrics} topWorkflows={workflowPerformance} />
            )}
          </div>
        </TabsContent>
        
        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-6">
          {errorMetrics && <ErrorMetricsCards data={errorMetrics} />}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {errorTrend && <ErrorTrendChart data={errorTrend} />}
            {errorsByType && <ErrorsByTypeChart data={errorsByType} />}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {errorsByType && <ErrorsByTypeBarChart data={errorsByType} />}
            {errorMetrics && <ErrorSummaryCompact data={errorMetrics} />}
          </div>
          
          {recentErrors && <RecentErrorsList data={recentErrors} />}
        </TabsContent>
        
        {/* Timing Tab */}
        <TabsContent value="timing" className="space-y-6">
          {timingMetrics && <TimingMetricsCards data={timingMetrics} />}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {executionsByHour && <ExecutionsByHourChart data={executionsByHour} />}
            {executionsByDay && <ExecutionsByDayChart data={executionsByDay} />}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {durationDistribution && <DurationDistributionChart data={durationDistribution} />}
            {durationDistribution && <DurationPieChart data={durationDistribution} />}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {executionsByHour && <AvgDurationByHourChart data={executionsByHour} />}
            {executionsByDay && <SuccessRateByDayChart data={executionsByDay} />}
          </div>
          
          {timingMetrics && <TimingSummaryCompact data={timingMetrics} />}
        </TabsContent>
        
        {/* Triggers Tab */}
        <TabsContent value="triggers" className="space-y-6">
          {triggerMetrics && <TriggerMetricsCards data={triggerMetrics} />}
          
          {triggerPerformance && <TriggerPerformanceTable data={triggerPerformance} />}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {triggerTrend && <TriggerTrendChart data={triggerTrend} />}
            {triggerPerformance && <TriggerDistributionChart data={triggerPerformance} />}
          </div>
          
          {triggerMetrics && <TriggerSummaryCompact data={triggerMetrics} />}
        </TabsContent>
        
        {/* Steps Tab */}
        <TabsContent value="steps" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {stepAnalytics && <StepAnalyticsChart data={stepAnalytics} />}
            {actionsByType && <ActionsByTypeChart data={actionsByType} />}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {executionTrend && <ExecutionLineChart data={executionTrend} />}
            {executionTrend && <ExecutionDurationChart data={executionTrend} />}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AutomationAnalyticsDashboardEnhanced;
