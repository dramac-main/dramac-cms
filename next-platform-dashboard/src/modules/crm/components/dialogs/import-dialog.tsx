/**
 * Import Contacts Dialog
 * 
 * CRM Enhancement: CSV Import
 * Import contacts from CSV files with field mapping and duplicate detection.
 * Industry-leader pattern: HubSpot Import, Salesforce Data Import Wizard
 */
'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, ArrowRight, X } from 'lucide-react'
import { importContacts } from '../../actions/bulk-actions'
import type { ImportFieldMapping, ImportResult } from '../../types/crm-types'

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string
  onImported?: () => void
}

const CRM_FIELDS = [
  { value: '', label: '— Skip —' },
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'company', label: 'Company' },
  { value: 'job_title', label: 'Job Title' },
  { value: 'status', label: 'Status' },
  { value: 'lead_status', label: 'Lead Status' },
  { value: 'source', label: 'Source' },
  { value: 'address_line1', label: 'Address Line 1' },
  { value: 'address_line2', label: 'Address Line 2' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State' },
  { value: 'postal_code', label: 'Postal Code' },
  { value: 'country', label: 'Country' },
  { value: 'website', label: 'Website' },
  { value: 'notes', label: 'Notes' },
]

type Step = 'upload' | 'mapping' | 'importing' | 'result'

export function ImportContactsDialog({ open, onOpenChange, siteId, onImported }: ImportDialogProps) {
  const [step, setStep] = useState<Step>('upload')
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvData, setCsvData] = useState<Record<string, string>[]>([])
  const [mappings, setMappings] = useState<ImportFieldMapping[]>([])
  const [updateExisting, setUpdateExisting] = useState(true)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep('upload')
    setCsvHeaders([])
    setCsvData([])
    setMappings([])
    setResult(null)
    setImporting(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) {
        toast.error('CSV file is empty or has only headers')
        return
      }

      const headers = parseCSVLine(lines[0])
      setCsvHeaders(headers)

      const rows: Record<string, string>[] = []
      for (let i = 1; i < Math.min(lines.length, 1001); i++) {
        const values = parseCSVLine(lines[i])
        const row: Record<string, string> = {}
        headers.forEach((h, idx) => {
          row[h] = values[idx] || ''
        })
        rows.push(row)
      }
      setCsvData(rows)

      // Auto-map fields
      const autoMappings = headers.map(header => {
        const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '_')
        const match = CRM_FIELDS.find(f => {
          const fieldNorm = f.value.toLowerCase()
          return fieldNorm === normalized ||
            normalized.includes(fieldNorm) ||
            fieldNorm.includes(normalized)
        })
        return {
          csvColumn: header,
          crmField: match?.value || '',
        }
      })
      setMappings(autoMappings)
      setStep('mapping')
    }
    reader.readAsText(file)
  }

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const updateMapping = (index: number, crmField: string) => {
    const updated = [...mappings]
    updated[index] = { ...updated[index], crmField }
    setMappings(updated)
  }

  const handleImport = async () => {
    const activeMappings = mappings.filter(m => m.crmField)
    if (activeMappings.length === 0) {
      toast.error('Please map at least one field')
      return
    }

    if (!activeMappings.find(m => m.crmField === 'email')) {
      toast.error('Email field mapping is required')
      return
    }

    setStep('importing')
    setImporting(true)

    try {
      const importResult = await importContacts(siteId, csvData, activeMappings, updateExisting)
      setResult(importResult)
      setStep('result')
      if (importResult.created > 0 || importResult.updated > 0) {
        onImported?.()
      }
    } catch (err) {
      toast.error((err as Error).message)
      setStep('mapping')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Contacts
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Badge variant={step === 'upload' ? 'default' : 'secondary'}>1. Upload</Badge>
          <ArrowRight className="h-3 w-3" />
          <Badge variant={step === 'mapping' ? 'default' : 'secondary'}>2. Map Fields</Badge>
          <ArrowRight className="h-3 w-3" />
          <Badge variant={step === 'importing' || step === 'result' ? 'default' : 'secondary'}>3. Import</Badge>
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="py-8">
            <div
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="font-medium mb-1">Upload CSV File</p>
              <p className="text-sm text-muted-foreground">
                Click to browse or drag and drop your CSV file
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Maximum 1,000 contacts per import
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        )}

        {/* Step 2: Field Mapping */}
        {step === 'mapping' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {csvData.length} row{csvData.length !== 1 ? 's' : ''} found
              </span>
              <div className="flex items-center gap-2">
                <Label htmlFor="update-existing" className="text-sm">Update existing contacts</Label>
                <Switch
                  id="update-existing"
                  checked={updateExisting}
                  onCheckedChange={setUpdateExisting}
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CSV Column</TableHead>
                  <TableHead>Sample Data</TableHead>
                  <TableHead>CRM Field</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{mapping.csvColumn}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {csvData[0]?.[mapping.csvColumn] || '-'}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={mapping.crmField}
                        onValueChange={(val) => updateMapping(i, val)}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Skip" />
                        </SelectTrigger>
                        <SelectContent>
                          {CRM_FIELDS.map(f => (
                            <SelectItem key={f.value} value={f.value || '__skip__'}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <DialogFooter>
              <Button variant="outline" onClick={() => { reset(); setStep('upload') }}>
                Back
              </Button>
              <Button onClick={handleImport}>
                Import {csvData.length} Contacts
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Importing */}
        {step === 'importing' && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="font-medium">Importing contacts...</p>
            <p className="text-sm text-muted-foreground">This may take a moment</p>
            <Progress value={50} className="w-[300px] mx-auto" />
          </div>
        )}

        {/* Step 4: Result */}
        {step === 'result' && result && (
          <div className="py-8 space-y-6">
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold">Import Complete</h3>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950">
                <div className="text-2xl font-bold text-green-600">{result.created}</div>
                <div className="text-sm text-muted-foreground">Created</div>
              </div>
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950">
                <div className="text-2xl font-bold text-blue-600">{result.updated}</div>
                <div className="text-sm text-muted-foreground">Updated</div>
              </div>
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950">
                <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-1">
                <Label className="flex items-center gap-1.5 text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Errors ({result.errors.length})
                </Label>
                <div className="max-h-[150px] overflow-y-auto rounded border p-2 text-xs font-mono">
                  {result.errors.map((err, i) => (
                    <div key={i} className="text-destructive">{err}</div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => { reset(); onOpenChange(false) }}>
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
