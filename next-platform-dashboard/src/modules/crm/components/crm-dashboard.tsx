/**
 * CRM Dashboard Main Component
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * PHASE-UI-10A/10B: Enhanced UI Components Integration
 * 
 * The main dashboard shell that provides navigation between CRM views
 */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ContactsView } from './views/contacts-view'
import { CompaniesView } from './views/companies-view'
import { DealsView } from './views/deals-view'
import { ActivitiesView } from './views/activities-view'
import { ReportsView } from './views/reports-view'
import { CRMProvider, useCRM } from '../context/crm-context'
import { 
  // Enhanced UI Components (PHASE-UI-10A/10B)
  CRMHeader,
  CRMMetricCards,
  type TimeRange
} from './ui'
import { 
  Users, 
  Building2, 
  TrendingUp, 
  Activity, 
  BarChart3,
  RefreshCw,
  LineChart
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { CRMSettings } from '../types/crm-types'

// ============================================================================
// DASHBOARD PROPS
// ============================================================================

interface CRMDashboardProps {
  siteId: string
  settings?: CRMSettings
}

// ============================================================================
// DASHBOARD CONTENT (Enhanced with PHASE-UI-10A/10B)
// ============================================================================

function CRMDashboardContent() {
  const { 
    contacts, 
    companies, 
    deals, 
    error, 
    refresh,
    siteId
  } = useCRM()
  
  const [activeTab, setActiveTab] = useState('deals')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')

  // Calculate summary stats
  const openDeals = deals.filter(d => d.status === 'open')
  const totalPipelineValue = openDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
  const wonDeals = deals.filter(d => d.status === 'won')
  const totalWonValue = wonDeals.reduce((sum, d) => sum + (d.amount || 0), 0)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refresh()
    setIsRefreshing(false)
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Enhanced Header (PHASE-UI-10A) */}
      <CRMHeader
        title="CRM Dashboard"
        description="Manage your contacts, companies, and deals"
        entityCount={contacts.length + companies.length + deals.length}
        entityLabel="total records"
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        showTimeSelector={true}
        showExportImport={true}
      />

      {/* Enhanced Metric Cards (PHASE-UI-10A) */}
      <div className="px-6 py-4 border-b bg-muted/30">
        <CRMMetricCards
          metrics={[
            {
              id: 'contacts',
              label: 'Total Contacts',
              value: contacts.length,
              icon: Users,
              onClick: () => setActiveTab('contacts'),
            },
            {
              id: 'companies',
              label: 'Companies',
              value: companies.length,
              icon: Building2,
              onClick: () => setActiveTab('companies'),
            },
            {
              id: 'openDeals',
              label: 'Open Deals',
              value: openDeals.length,
              icon: TrendingUp,
              onClick: () => setActiveTab('deals'),
            },
            {
              id: 'pipelineValue',
              label: 'Pipeline Value',
              value: totalPipelineValue,
              format: 'currency',
              icon: BarChart3,
              onClick: () => setActiveTab('reports'),
            },
            {
              id: 'wonValue',
              label: 'Won This Month',
              value: totalWonValue,
              format: 'currency',
              icon: Activity,
              color: 'success',
            },
          ]}
          columns={5}
        />
      </div>

      {/* Main Content */}
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="flex-1 flex flex-col"
      >
        <div className="border-b px-6">
          <TabsList className="bg-transparent h-12">
            <TabsTrigger value="deals" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              <TrendingUp className="h-4 w-4" />
              Deals
              <Badge variant="secondary" className="ml-1">{openDeals.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              <Users className="h-4 w-4" />
              Contacts
              <Badge variant="secondary" className="ml-1">{contacts.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="companies" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              <Building2 className="h-4 w-4" />
              Companies
              <Badge variant="secondary" className="ml-1">{companies.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="activities" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              <Activity className="h-4 w-4" />
              Activities
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              <BarChart3 className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              <LineChart className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="deals" className="flex-1 m-0 data-[state=active]:flex data-[state=active]:flex-col">
          <DealsView />
        </TabsContent>
        <TabsContent value="contacts" className="flex-1 m-0">
          <ContactsView />
        </TabsContent>
        <TabsContent value="companies" className="flex-1 m-0">
          <CompaniesView />
        </TabsContent>
        <TabsContent value="activities" className="flex-1 m-0">
          <ActivitiesView />
        </TabsContent>
        <TabsContent value="reports" className="flex-1 m-0">
          <ReportsView />
        </TabsContent>
        <TabsContent value="analytics" className="flex-1 m-0 p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">CRM Analytics</h2>
              <p className="text-muted-foreground">Comprehensive analytics and insights for your CRM data.</p>
            </div>
            <Link href={`/dashboard/sites/${siteId}/crm-module/analytics`}>
              <Button size="lg" className="w-full max-w-md">
                <LineChart className="h-5 w-5 mr-2" />
                Open Analytics Dashboard
              </Button>
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export function CRMDashboard({ siteId, settings = {} }: CRMDashboardProps) {
  return (
    <CRMProvider siteId={siteId} settings={settings}>
      <CRMDashboardContent />
    </CRMProvider>
  )
}

export default CRMDashboard
