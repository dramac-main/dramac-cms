/**
 * Gift Cards View Component
 * 
 * Phase ECOM-42B: Marketing Features - UI Components
 * 
 * Displays gift cards management with lookup, issuance, and transaction history
 */
'use client'

import { useState, useMemo } from 'react'
import { useGiftCards } from '../../hooks/use-marketing'
import { CreateGiftCardDialog } from '../dialogs/create-gift-card-dialog'
import type { GiftCard, GiftCardTransaction } from '../../types/marketing-types'
import { 
  Gift, 
  Plus, 
  MoreHorizontal,
  Search,
  Eye,
  Ban,
  Copy,
  CircleCheck,
  CircleX,
  Clock,
  CreditCard,
  Coins,
  ArrowDownRight,
  ArrowUpRight,
  History
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import { DEFAULT_LOCALE, formatCurrency } from '@/lib/locale-config'
interface GiftCardsViewProps {
  siteId: string
  searchQuery?: string
}

export function GiftCardsView({ siteId, searchQuery = '' }: GiftCardsViewProps) {
  const { 
    cards: giftCards, 
    isLoading, 
    error, 
    refresh: refreshGiftCards,
    lookup: lookupGiftCard
  } = useGiftCards(siteId)
  
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [lookupCode, setLookupCode] = useState('')
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupResult, setLookupResult] = useState<GiftCard | null>(null)
  const [showLookupDialog, setShowLookupDialog] = useState(false)
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null)
  const [transactions, setTransactions] = useState<GiftCardTransaction[]>([])
  const [showTransactionsDialog, setShowTransactionsDialog] = useState(false)
  const [loadingTransactions, setLoadingTransactions] = useState(false)

  // Filter gift cards
  const filteredCards = useMemo(() => {
    if (!searchQuery) return giftCards
    
    const query = searchQuery.toLowerCase()
    return giftCards.filter((c: GiftCard) => 
      c.code.toLowerCase().includes(query) ||
      c.recipient_email?.toLowerCase().includes(query) ||
      c.recipient_name?.toLowerCase().includes(query)
    )
  }, [giftCards, searchQuery])

  // Calculate stats
  const stats = useMemo(() => {
    const active = giftCards.filter((c: GiftCard) => c.is_active)
    const totalIssued = giftCards.reduce((sum: number, c: GiftCard) => sum + c.initial_balance, 0)
    const totalBalance = active.reduce((sum: number, c: GiftCard) => sum + c.current_balance, 0)
    const redeemed = totalIssued - giftCards.reduce((sum: number, c: GiftCard) => sum + c.current_balance, 0)
    
    return {
      total: giftCards.length,
      active: active.length,
      totalIssued,
      totalBalance,
      redeemed
    }
  }, [giftCards])

  const handleLookup = async () => {
    if (!lookupCode.trim()) {
      toast.error('Please enter a gift card code')
      return
    }

    setIsLookingUp(true)
    const card = await lookupGiftCard(lookupCode.trim())
    setIsLookingUp(false)

    if (card) {
      setLookupResult(card)
      setShowLookupDialog(true)
    } else {
      toast.error('Gift card not found')
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Gift card code copied!')
  }

  const handleViewTransactions = async (card: GiftCard) => {
    setSelectedCard(card)
    setShowTransactionsDialog(true)
    // Note: Transaction history would require additional API - show empty for now
    setTransactions(card.transactions || [])
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(DEFAULT_LOCALE, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(DEFAULT_LOCALE, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const isExpired = (card: GiftCard) => {
    if (!card.expires_at) return false
    return new Date(card.expires_at) < new Date()
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
        <CircleX className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold">Error loading gift cards</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={() => refreshGiftCards()}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issued</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalIssued / 100)}</div>
            <p className="text-xs text-muted-foreground">{stats.total} cards</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalBalance / 100)}</div>
            <p className="text-xs text-muted-foreground">{stats.active} active cards</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redeemed</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.redeemed / 100)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalIssued > 0 
                ? `${Math.round((stats.redeemed / stats.totalIssued) * 100)}% redemption rate`
                : 'No cards issued'
              }
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cards</CardTitle>
            <Gift className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total - stats.active} inactive
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lookup and Create */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Enter gift card code to lookup..."
            value={lookupCode}
            onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            className="max-w-md font-mono"
          />
          <Button variant="outline" onClick={handleLookup} disabled={isLookingUp}>
            {isLookingUp ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Issue Gift Card
        </Button>
      </div>

      {/* Gift Cards Table */}
      {filteredCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
          <Gift className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No gift cards found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery 
              ? 'Try adjusting your search' 
              : 'Issue gift cards to allow customers to purchase store credit'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Issue Gift Card
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Initial</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCards.map((card: GiftCard) => (
                <TableRow key={card.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-muted rounded text-xs">
                        {card.code}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopyCode(card.code)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {card.recipient_name || card.recipient_email || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(card.initial_balance / 100)}</TableCell>
                  <TableCell>
                    <span className={cn(
                      'font-medium',
                      card.current_balance === 0 && 'text-muted-foreground'
                    )}>
                      {formatCurrency(card.current_balance / 100)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {card.expires_at ? (
                      <span className={cn(isExpired(card) && 'text-destructive')}>
                        {formatDate(card.expires_at)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {!card.is_active ? (
                      <Badge variant="destructive" className="gap-1">
                        <Ban className="h-3 w-3" />
                        Inactive
                      </Badge>
                    ) : isExpired(card) ? (
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Expired
                      </Badge>
                    ) : card.current_balance === 0 ? (
                      <Badge variant="secondary" className="gap-1">
                        <CircleCheck className="h-3 w-3" />
                        Redeemed
                      </Badge>
                    ) : (
                      <Badge className="gap-1 bg-green-500/10 text-green-500">
                        <CircleCheck className="h-3 w-3" />
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCopyCode(card.code)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Code
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewTransactions(card)}>
                          <History className="h-4 w-4 mr-2" />
                          View Transactions
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Gift Card Dialog */}
      <CreateGiftCardDialog
        siteId={siteId}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          setShowCreateDialog(false)
          refreshGiftCards()
        }}
      />

      {/* Lookup Result Dialog */}
      <Dialog open={showLookupDialog} onOpenChange={setShowLookupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gift Card Details</DialogTitle>
            <DialogDescription>
              Gift card information for code {lookupResult?.code}
            </DialogDescription>
          </DialogHeader>
          {lookupResult && (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">Current Balance</div>
                  <div className="text-3xl font-bold">{formatCurrency(lookupResult.current_balance / 100)}</div>
                </div>
                <Badge className={cn(
                  lookupResult.is_active && lookupResult.current_balance > 0
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-gray-500/10 text-gray-500'
                )}>
                  {!lookupResult.is_active ? 'Inactive' : lookupResult.current_balance === 0 ? 'Empty' : 'Active'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Initial Balance</div>
                  <div className="font-medium">{formatCurrency(lookupResult.initial_balance / 100)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Expires</div>
                  <div className="font-medium">
                    {lookupResult.expires_at ? formatDate(lookupResult.expires_at) : 'Never'}
                  </div>
                </div>
                {lookupResult.recipient_name && (
                  <div>
                    <div className="text-muted-foreground">Recipient</div>
                    <div className="font-medium">{lookupResult.recipient_name}</div>
                  </div>
                )}
                {lookupResult.recipient_email && (
                  <div>
                    <div className="text-muted-foreground">Email</div>
                    <div className="font-medium">{lookupResult.recipient_email}</div>
                  </div>
                )}
              </div>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  handleViewTransactions(lookupResult)
                  setShowLookupDialog(false)
                }}
              >
                <History className="h-4 w-4 mr-2" />
                View Transaction History
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transactions Dialog */}
      <Dialog open={showTransactionsDialog} onOpenChange={setShowTransactionsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction History</DialogTitle>
            <DialogDescription>
              Transactions for gift card {selectedCard?.code}
            </DialogDescription>
          </DialogHeader>
          {loadingTransactions ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found for this gift card.
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{formatDateTime(tx.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant={tx.type === 'purchase' || tx.type === 'refund' ? 'default' : 'secondary'}>
                          {tx.type === 'purchase' || tx.type === 'refund' ? (
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 mr-1" />
                          )}
                          {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn(
                        'font-medium',
                        tx.type === 'purchase' || tx.type === 'refund' ? 'text-green-600' : 'text-red-600'
                      )}>
                        {tx.type === 'purchase' || tx.type === 'refund' ? '+' : '-'}{formatCurrency(tx.amount / 100)}
                      </TableCell>
                      <TableCell>{formatCurrency(tx.balance_after / 100)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {tx.notes || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
