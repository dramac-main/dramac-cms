/**
 * Companies List View
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * 
 * Displays companies/accounts in a sortable, filterable table
 */
'use client'

import { useState, useMemo } from 'react'
import { useCRM } from '../../context/crm-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Globe,
  Phone, 
  Users, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Building2,
  Coins
} from 'lucide-react'
import { exportToCSV, flattenCompany } from '../../utils/export-csv'
import { toast } from 'sonner'
import { CreateCompanyDialog } from '../dialogs/create-company-dialog'
import { CompanyDetailSheet } from '../sheets/company-detail-sheet'
import { Skeleton } from '@/components/ui/skeleton'

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
// ============================================================================
// HELPERS
// ============================================================================

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(DEFAULT_LOCALE, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '-'
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency: DEFAULT_CURRENCY,
    maximumFractionDigits: 0
  }).format(amount)
}

function getAccountTypeColor(type?: string | null): string {
  const colors: Record<string, string> = {
    prospect: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    customer: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    partner: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    competitor: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }
  return colors[type || ''] || 'bg-gray-100 text-gray-800'
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CompaniesView() {
  const { companies, contacts, removeCompany, isLoading } = useCRM()
  
  // State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchesSearch = 
          company.name.toLowerCase().includes(q) ||
          company.industry?.toLowerCase().includes(q) ||
          company.website?.toLowerCase().includes(q)
        if (!matchesSearch) return false
      }
      
      // Status filter
      if (statusFilter !== 'all' && company.status !== statusFilter) {
        return false
      }
      
      // Type filter
      if (typeFilter !== 'all' && company.account_type !== typeFilter) {
        return false
      }
      
      return true
    })
  }, [companies, search, statusFilter, typeFilter])

  // Get contact count for each company
  const contactCountMap = useMemo(() => {
    const map = new Map<string, number>()
    contacts.forEach(contact => {
      if (contact.company_id) {
        map.set(contact.company_id, (map.get(contact.company_id) || 0) + 1)
      }
    })
    return map
  }, [contacts])

  // Handlers
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this company? This will not delete associated contacts.')) {
      await removeCompany(id)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="border rounded-lg">
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filters */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="partner">Partner</SelectItem>
              <SelectItem value="competitor">Competitor</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          
          <span className="text-sm text-muted-foreground">
            {filteredCompanies.length} of {companies.length} companies
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            try {
              const data = filteredCompanies.map(c => flattenCompany(c as unknown as Record<string, unknown>))
              exportToCSV(data, `companies-${new Date().toISOString().slice(0, 10)}`)
              toast.success(`Exported ${data.length} companies`)
            } catch (error) {
              console.error('Export failed:', error)
              toast.error('Failed to export companies')
            }
          }}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Company</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Website</TableHead>
              <TableHead className="text-center">Contacts</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCompanies.map((company) => (
              <TableRow 
                key={company.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedCompanyId(company.id)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{company.name}</div>
                      {company.phone && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {company.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {company.industry || <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell>
                  {company.website ? (
                    <a 
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm hover:text-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Globe className="h-3 w-3" />
                      {company.website.replace(/^https?:\/\//, '')}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    {contactCountMap.get(company.id) || 0}
                  </div>
                </TableCell>
                <TableCell>
                  {company.account_type ? (
                    <Badge className={getAccountTypeColor(company.account_type)}>
                      {company.account_type}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {company.annual_revenue ? (
                    <div className="flex items-center gap-1">
                      <Coins className="h-3 w-3 text-muted-foreground" />
                      {formatCurrency(company.annual_revenue)}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(company.created_at)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        setSelectedCompanyId(company.id)
                      }}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        setSelectedCompanyId(company.id)
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(company.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            
            {filteredCompanies.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="text-muted-foreground">
                    {search || statusFilter !== 'all' || typeFilter !== 'all'
                      ? 'No companies match your filters'
                      : 'No companies yet. Add your first company!'}
                  </div>
                  {!search && statusFilter === 'all' && typeFilter === 'all' && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setCreateDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Company
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <CreateCompanyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {selectedCompanyId && (
        <CompanyDetailSheet
          companyId={selectedCompanyId}
          open={!!selectedCompanyId}
          onOpenChange={(open) => !open && setSelectedCompanyId(null)}
        />
      )}
    </div>
  )
}

export default CompaniesView
