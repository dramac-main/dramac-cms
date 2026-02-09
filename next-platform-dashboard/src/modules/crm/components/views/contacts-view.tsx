/**
 * Contacts List View
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * 
 * Displays contacts in a sortable, filterable table with actions
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
  Mail, 
  Phone, 
  Building2, 
  Edit, 
  Trash2, 
  Eye,
  Filter,
  Download,
  Upload
} from 'lucide-react'
import { CreateContactDialog } from '../dialogs/create-contact-dialog'
import { ContactDetailSheet } from '../sheets/contact-detail-sheet'
import { Skeleton } from '@/components/ui/skeleton'

import { DEFAULT_LOCALE } from '@/lib/locale-config'
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

function getLeadStatusColor(status?: string | null): string {
  const colors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    qualified: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    unqualified: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    converted: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
  }
  return colors[status || ''] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ContactsView() {
  const { contacts, removeContact, isLoading } = useCRM()
  
  // State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [editingContactId, setEditingContactId] = useState<string | null>(null)

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchesSearch = 
          contact.first_name?.toLowerCase().includes(q) ||
          contact.last_name?.toLowerCase().includes(q) ||
          contact.email?.toLowerCase().includes(q) ||
          contact.company?.name?.toLowerCase().includes(q) ||
          contact.job_title?.toLowerCase().includes(q)
        if (!matchesSearch) return false
      }
      
      // Status filter
      if (statusFilter !== 'all' && contact.status !== statusFilter) {
        return false
      }
      
      // Lead status filter
      if (leadStatusFilter !== 'all' && contact.lead_status !== leadStatusFilter) {
        return false
      }
      
      return true
    })
  }, [contacts, search, statusFilter, leadStatusFilter])

  // Handlers
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
      await removeContact(id)
    }
  }

  const handleExport = () => {
    // TODO: Implement CSV export
    console.log('Export contacts')
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
              placeholder="Search contacts..."
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
          
          <Select value={leadStatusFilter} onValueChange={setLeadStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Lead Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leads</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="unqualified">Unqualified</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
            </SelectContent>
          </Select>
          
          <span className="text-sm text-muted-foreground">
            {filteredContacts.length} of {contacts.length} contacts
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Lead Status</TableHead>
              <TableHead className="text-center">Score</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.map((contact) => (
              <TableRow 
                key={contact.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedContactId(contact.id)}
              >
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {contact.first_name} {contact.last_name}
                    </div>
                    {contact.job_title && (
                      <div className="text-xs text-muted-foreground">
                        {contact.job_title}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {contact.email ? (
                    <a 
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-1 text-sm hover:text-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Mail className="h-3 w-3" />
                      {contact.email}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {contact.phone ? (
                    <a 
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-1 text-sm hover:text-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="h-3 w-3" />
                      {contact.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {contact.company ? (
                    <div className="flex items-center gap-1 text-sm">
                      <Building2 className="h-3 w-3" />
                      {contact.company.name}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {contact.lead_status ? (
                    <Badge className={getLeadStatusColor(contact.lead_status)}>
                      {contact.lead_status}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{contact.lead_score}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(contact.created_at)}
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
                        setSelectedContactId(contact.id)
                      }}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        setEditingContactId(contact.id)
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(contact.id)
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
            
            {filteredContacts.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="text-muted-foreground">
                    {search || statusFilter !== 'all' || leadStatusFilter !== 'all'
                      ? 'No contacts match your filters'
                      : 'No contacts yet. Add your first contact!'}
                  </div>
                  {!search && statusFilter === 'all' && leadStatusFilter === 'all' && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setCreateDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <CreateContactDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {selectedContactId && (
        <ContactDetailSheet
          contactId={selectedContactId}
          open={!!selectedContactId}
          onOpenChange={(open) => !open && setSelectedContactId(null)}
        />
      )}
    </div>
  )
}

export default ContactsView
