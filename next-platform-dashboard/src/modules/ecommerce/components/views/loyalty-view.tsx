/**
 * Loyalty View Component
 * 
 * Phase ECOM-42B: Marketing Features - UI Components
 * 
 * Displays loyalty program configuration and member management
 */
'use client'

import { useState, useMemo } from 'react'
import { useLoyalty } from '../../hooks/use-marketing'
import { LoyaltyConfigDialog } from '../dialogs/loyalty-config-dialog'
import { AdjustPointsDialog } from '../dialogs/adjust-points-dialog'
import type { LoyaltyPoints } from '../../types/marketing-types'
import { 
  Star, 
  Plus, 
  MoreHorizontal,
  Settings,
  Gift,
  Users,
  TrendingUp,
  Award,
  Coins,
  RefreshCw,
  XCircle,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import { DEFAULT_LOCALE, formatCurrency, DEFAULT_CURRENCY_SYMBOL } from '@/lib/locale-config'
interface LoyaltyViewProps {
  siteId: string
  searchQuery?: string
}

export function LoyaltyView({ siteId, searchQuery = '' }: LoyaltyViewProps) {
  const { 
    config, 
    members, 
    isLoading, 
    error, 
    refreshConfig, 
    refreshMembers 
  } = useLoyalty(siteId)
  
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [selectedMember, setSelectedMember] = useState<LoyaltyPoints | null>(null)
  const [showAdjustDialog, setShowAdjustDialog] = useState(false)

  // Filter members
  const filteredMembers = useMemo(() => {
    if (!searchQuery || !members) return members || []
    
    const query = searchQuery.toLowerCase()
    return members.filter((m: LoyaltyPoints) => {
      const fullName = m.customer ? `${m.customer.first_name || ''} ${m.customer.last_name || ''}`.trim() : ''
      return fullName.toLowerCase().includes(query) ||
        m.customer?.email?.toLowerCase().includes(query)
    })
  }, [members, searchQuery])

  // Calculate stats
  const stats = useMemo(() => {
    if (!members) return { totalMembers: 0, totalPoints: 0, totalLifetime: 0 }
    
    return {
      totalMembers: members.length,
      totalPoints: members.reduce((sum: number, m: LoyaltyPoints) => sum + m.points_balance, 0),
      totalLifetime: members.reduce((sum: number, m: LoyaltyPoints) => sum + m.lifetime_points, 0),
    }
  }, [members])

  const handleConfigureProgram = () => {
    setShowConfigDialog(true)
  }

  const handleAdjustPoints = (member: LoyaltyPoints) => {
    setSelectedMember(member)
    setShowAdjustDialog(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(DEFAULT_LOCALE, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getTierBadge = (tier: string | undefined) => {
    if (!tier) return null
    
    const tierColors: Record<string, string> = {
      bronze: 'bg-amber-700/10 text-amber-700',
      silver: 'bg-gray-400/10 text-gray-500',
      gold: 'bg-yellow-500/10 text-yellow-600',
      platinum: 'bg-purple-500/10 text-purple-500',
      diamond: 'bg-blue-500/10 text-blue-500',
    }

    return (
      <Badge className={cn('gap-1', tierColors[tier.toLowerCase()] || 'bg-gray-500/10 text-gray-500')}>
        <Award className="h-3 w-3" />
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold">Error loading loyalty program</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={() => {
          refreshConfig()
          refreshMembers()
        }}>
          Try Again
        </Button>
      </div>
    )
  }

  // No config - show setup screen
  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <div className="p-4 rounded-full bg-amber-500/10 mb-4">
          <Star className="h-12 w-12 text-amber-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Set Up Your Loyalty Program</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Reward your customers with points for purchases. Configure earning rates, 
          redemption values, and tier benefits to build customer loyalty.
        </p>
        <Button onClick={handleConfigureProgram} size="lg">
          <Settings className="h-4 w-4 mr-2" />
          Configure Loyalty Program
        </Button>
        
        <LoyaltyConfigDialog
          siteId={siteId}
          config={null}
          open={showConfigDialog}
          onOpenChange={setShowConfigDialog}
          onSuccess={() => {
            setShowConfigDialog(false)
            refreshConfig()
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Program Configuration Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              {config.program_name || 'Loyalty Program'}
            </CardTitle>
            <CardDescription>
              {config.is_enabled ? 'Program is active' : 'Program is paused'}
            </CardDescription>
          </div>
          <Button variant="outline" onClick={handleConfigureProgram}>
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Coins className="h-6 w-6 mx-auto mb-2 text-amber-500" />
              <div className="text-2xl font-bold">{config.points_per_dollar}</div>
              <div className="text-xs text-muted-foreground">points per {DEFAULT_CURRENCY_SYMBOL}1 spent</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Gift className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{config.points_value_cents}</div>
              <div className="text-xs text-muted-foreground">points = {DEFAULT_CURRENCY_SYMBOL}1 discount</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{config.minimum_redemption}</div>
              <div className="text-xs text-muted-foreground">minimum points to redeem</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">{stats.totalMembers}</div>
              <div className="text-xs text-muted-foreground">total members</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Points</CardTitle>
            <Coins className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats.totalPoints.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Worth {formatCurrency(stats.totalPoints / (config.points_value_cents || 100))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lifetime Points Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalLifetime.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              Customers enrolled in your loyalty program
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refreshMembers()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery 
                ? 'No members match your search' 
                : 'No members enrolled yet. Points will be tracked when customers make purchases.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Points Balance</TableHead>
                  <TableHead>Lifetime Earned</TableHead>
                  <TableHead>Lifetime Redeemed</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {member.customer ? `${member.customer.first_name || ''} ${member.customer.last_name || ''}`.trim() || 'Unknown' : 'Unknown'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {member.customer?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTierBadge(member.current_tier || undefined)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-medium text-amber-600">
                        <Coins className="h-4 w-4" />
                        {member.points_balance.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-green-600">
                        <ChevronUp className="h-4 w-4" />
                        {member.lifetime_points.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <ChevronDown className="h-4 w-4" />
                        {member.redeemed_points.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {member.last_earned_at 
                        ? formatDate(member.last_earned_at)
                        : <span className="text-muted-foreground">—</span>
                      }
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAdjustPoints(member)}>
                            <Coins className="h-4 w-4 mr-2" />
                            Adjust Points
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <LoyaltyConfigDialog
        siteId={siteId}
        config={config}
        open={showConfigDialog}
        onOpenChange={setShowConfigDialog}
        onSuccess={() => {
          setShowConfigDialog(false)
          refreshConfig()
        }}
      />

      <AdjustPointsDialog
        siteId={siteId}
        member={selectedMember}
        open={showAdjustDialog}
        onOpenChange={setShowAdjustDialog}
        onSuccess={() => {
          setShowAdjustDialog(false)
          refreshMembers()
        }}
      />
    </div>
  )
}
