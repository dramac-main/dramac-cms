/**
 * CRM Dashboard Main Component
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * 
 * The main dashboard shell that provides navigation between CRM views
 */
'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ContactsView } from './views/contacts-view'
import { CompaniesView } from './views/companies-view'
import { DealsView } from './views/deals-view'
import { ActivitiesView } from './views/activities-view'
import { ReportsView } from './views/reports-view'
import { CRMProvider, useCRM } from '../context/crm-context'
import { 
  Users, 
  Building2, 
  TrendingUp, 
  Activity, 
  BarChart3,
  Search,
  Plus,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { CRMSettings } from '../types/crm-types'

// ============================================================================
// DASHBOARD PROPS
// ============================================================================

interface CRMDashboardProps {
  siteId: string
  settings?: CRMSettings
}

// ============================================================================
// DASHBOARD CONTENT
// ============================================================================

function CRMDashboardContent() {
  const { 
    contacts, 
    companies, 
    deals, 
    activities,
    error, 
    refresh,
    search
  } = useCRM()
  
  const [activeTab, setActiveTab] = useState('deals')
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Calculate summary stats
  const openDeals = deals.filter(d => d.status === 'open')
  const totalPipelineValue = openDeals.reduce((sum, d) => sum + (d.amount || 0), 0)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refresh()
    setIsRefreshing(false)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    try {
      const results = await search(searchQuery)
      console.log('Search results:', results)
      // TODO: Show search results in a modal or dropdown
    } catch (error) {
      console.error('Search error:', error)
    }
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
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">CRM Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Manage your contacts, companies, and deals
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 w-64"
              />
            </div>
            
            {/* Actions */}
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setActiveTab('contacts')}>
                  <Users className="h-4 w-4 mr-2" />
                  New Contact
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('companies')}>
                  <Building2 className="h-4 w-4 mr-2" />
                  New Company
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('deals')}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  New Deal
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveTab('activities')}>
                  <Activity className="h-4 w-4 mr-2" />
                  Log Activity
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-5 gap-4 mt-4">
          <QuickStat 
            label="Contacts" 
            value={contacts.length} 
            icon={Users}
            onClick={() => setActiveTab('contacts')}
          />
          <QuickStat 
            label="Companies" 
            value={companies.length} 
            icon={Building2}
            onClick={() => setActiveTab('companies')}
          />
          <QuickStat 
            label="Open Deals" 
            value={openDeals.length} 
            icon={TrendingUp}
            onClick={() => setActiveTab('deals')}
          />
          <QuickStat 
            label="Pipeline Value" 
            value={`$${(totalPipelineValue / 1000).toFixed(0)}k`} 
            icon={BarChart3}
            onClick={() => setActiveTab('reports')}
          />
          <QuickStat 
            label="Activities" 
            value={activities.length} 
            icon={Activity}
            onClick={() => setActiveTab('activities')}
          />
        </div>
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
      </Tabs>
    </div>
  )
}

// ============================================================================
// QUICK STAT COMPONENT
// ============================================================================

interface QuickStatProps {
  label: string
  value: string | number
  icon: React.ElementType
  onClick?: () => void
}

function QuickStat({ label, value, icon: Icon, onClick }: QuickStatProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
    >
      <div className="p-2 rounded-md bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <div className="text-lg font-semibold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </button>
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
