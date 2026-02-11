/**
 * Import Products Dialog
 * 
 * Phase ECOM-02: Product Management Enhancement
 * 
 * CSV import with preview and validation
 */
'use client'

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Download
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/locale-config'
import { importProducts } from '../../actions/product-import-export'
import type { ProductImportRow, ProductImportResult } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface ImportProductsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string
  agencyId: string
  onSuccess: () => void
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete'

// ============================================================================
// COMPONENT
// ============================================================================

export function ImportProductsDialog({
  open,
  onOpenChange,
  siteId,
  agencyId,
  onSuccess
}: ImportProductsDialogProps) {
  const [step, setStep] = useState<ImportStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<ProductImportRow[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<ProductImportResult | null>(null)

  // Parse CSV
  const parseCSV = useCallback((content: string): { rows: ProductImportRow[]; errors: string[] } => {
    const lines = content.split('\n').filter(line => line.trim())
    const errors: string[] = []
    const rows: ProductImportRow[] = []

    if (lines.length < 2) {
      errors.push('File must have a header row and at least one data row')
      return { rows, errors }
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
    
    // Required fields
    if (!headers.includes('name')) {
      errors.push('Missing required column: name')
    }
    if (!headers.includes('base_price') && !headers.includes('price')) {
      errors.push('Missing required column: base_price or price')
    }

    if (errors.length > 0) {
      return { rows, errors }
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''))
      const row: Record<string, unknown> = {}

      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })

      // Validate and transform row
      const importRow: ProductImportRow = {
        name: row.name as string || '',
        sku: row.sku as string || undefined,
        description: row.description as string || undefined,
        base_price: parseFloat(row.base_price as string || row.price as string || '0'),
        compare_at_price: row.compare_at_price ? parseFloat(row.compare_at_price as string) : undefined,
        quantity: row.quantity ? parseInt(row.quantity as string) : undefined,
        category: row.category as string || undefined,
        status: (row.status as string)?.toLowerCase() as 'active' | 'draft' | 'archived' || 'draft',
        images: row.images as string || undefined,
        track_inventory: row.track_inventory === 'true' || row.track_inventory === 'yes',
        low_stock_threshold: row.low_stock_threshold ? parseInt(row.low_stock_threshold as string) : undefined
      }

      rows.push(importRow)
    }

    return { rows, errors }
  }, [])

  // File drop handler
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0]
    if (!csvFile) return

    setFile(csvFile)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const { rows, errors } = parseCSV(content)
      
      setPreviewData(rows)
      setParseErrors(errors)
      
      if (errors.length === 0 && rows.length > 0) {
        setStep('preview')
      }
    }
    reader.readAsText(csvFile)
  }, [parseCSV])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    maxFiles: 1
  })

  // Import handler
  const handleImport = async () => {
    setStep('importing')
    setImportProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const result = await importProducts(siteId, agencyId, previewData)
      
      clearInterval(progressInterval)
      setImportProgress(100)
      setImportResult(result)
      setStep('complete')

      if (result.success) {
        onSuccess()
      }
    } catch (error) {
      setImportResult({
        success: false,
        imported: 0,
        skipped: previewData.length,
        errors: [{ row: 0, message: error instanceof Error ? error.message : 'Import failed' }]
      })
      setStep('complete')
    }
  }

  // Reset dialog
  const handleReset = () => {
    setStep('upload')
    setFile(null)
    setPreviewData([])
    setParseErrors([])
    setImportProgress(0)
    setImportResult(null)
  }

  // Download template
  const downloadTemplate = () => {
    const template = 'name,sku,description,base_price,compare_at_price,quantity,category,status,images,track_inventory,low_stock_threshold\n"Example Product","SKU-001","Product description",29.99,39.99,100,"Category Name","draft","https://example.com/image.jpg",true,5'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'product-import-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) handleReset()
      onOpenChange(value)
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Import Products</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import products
          </DialogDescription>
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
              )}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">
                {isDragActive ? 'Drop your CSV file here' : 'Drag & drop a CSV file'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse
              </p>
            </div>

            {parseErrors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-destructive font-medium mb-2">
                  <XCircle className="h-4 w-4" />
                  Errors in file
                </div>
                <ul className="text-sm text-destructive space-y-1">
                  {parseErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              <p className="text-sm text-muted-foreground">
                Required columns: name, base_price
              </p>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{file?.name}</span>
                <Badge variant="secondary">{previewData.length} products</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>
                Change file
              </Button>
            </div>

            <ScrollArea className="h-[400px] border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 100).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.sku || '—'}</TableCell>
                      <TableCell>{formatCurrency(row.base_price)}</TableCell>
                      <TableCell>{row.quantity ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{row.status || 'draft'}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {previewData.length > 100 && (
                <p className="text-center py-4 text-sm text-muted-foreground">
                  Showing first 100 of {previewData.length} products
                </p>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Importing Step */}
        {step === 'importing' && (
          <div className="py-12 text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="text-lg font-medium">Importing products...</p>
            <Progress value={importProgress} className="w-64 mx-auto" />
            <p className="text-sm text-muted-foreground">
              {Math.round(importProgress)}% complete
            </p>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && importResult && (
          <div className="py-8 space-y-6">
            <div className="text-center">
              {importResult.success ? (
                <>
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <p className="text-xl font-medium text-green-600">Import Complete!</p>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                  <p className="text-xl font-medium text-yellow-600">Import Completed with Issues</p>
                </>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                <p className="text-sm text-muted-foreground">Imported</p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{importResult.skipped}</p>
                <p className="text-sm text-muted-foreground">Skipped</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{importResult.errors.length}</p>
                <p className="text-sm text-muted-foreground">Errors</p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <ScrollArea className="h-40 border rounded-lg p-4">
                <div className="space-y-2">
                  {importResult.errors.map((error, i) => (
                    <div key={i} className="text-sm">
                      <span className="text-muted-foreground">Row {error.row}:</span>{' '}
                      <span className="text-destructive">{error.message}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={handleReset}>
                Cancel
              </Button>
              <Button onClick={handleImport}>
                Import {previewData.length} Products
              </Button>
            </>
          )}
          {step === 'complete' && (
            <Button onClick={() => onOpenChange(false)}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
