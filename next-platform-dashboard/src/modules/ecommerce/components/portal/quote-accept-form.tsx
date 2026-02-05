/**
 * Quote Accept Form Component
 * 
 * Phase ECOM-12: Quote Workflow & Customer Portal
 * 
 * Form for customer to accept a quote
 */
'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, CheckCircle, Eraser } from 'lucide-react'
import { toast } from 'sonner'
import { acceptQuote } from '../../actions/quote-workflow-actions'

// ============================================================================
// TYPES
// ============================================================================

interface QuoteAcceptFormProps {
  token: string
  quoteName: string
  onAccepted: () => void
  onCancel: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteAcceptForm({
  token,
  quoteName,
  onAccepted,
  onCancel
}: QuoteAcceptFormProps) {
  const [loading, setLoading] = useState(false)
  const [acceptedBy, setAcceptedBy] = useState(quoteName)
  const [acceptedEmail, setAcceptedEmail] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [signatureData, setSignatureData] = useState<string | null>(null)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  
  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set up canvas
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])
  
  // Drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    isDrawing.current = true
    
    const rect = canvas.getBoundingClientRect()
    let x: number, y: number
    
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }
    
    ctx.beginPath()
    ctx.moveTo(x, y)
  }
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const rect = canvas.getBoundingClientRect()
    let x: number, y: number
    
    if ('touches' in e) {
      e.preventDefault()
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }
    
    ctx.lineTo(x, y)
    ctx.stroke()
  }
  
  const stopDrawing = () => {
    if (!isDrawing.current) return
    
    isDrawing.current = false
    
    const canvas = canvasRef.current
    if (canvas) {
      setSignatureData(canvas.toDataURL('image/png'))
    }
  }
  
  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignatureData(null)
  }
  
  // Form validation
  const isValid = acceptedBy.trim() !== '' && 
                  acceptedEmail.trim() !== '' && 
                  acceptedTerms && 
                  signatureData !== null
  
  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isValid) {
      toast.error('Please complete all required fields')
      return
    }
    
    setLoading(true)
    
    try {
      const result = await acceptQuote({
        token,
        accepted_by_name: acceptedBy.trim(),
        accepted_by_email: acceptedEmail.trim(),
        signature_data: signatureData || undefined
      })
      
      if (result.success) {
        toast.success('Quote accepted successfully!')
        onAccepted()
      } else {
        toast.error(result.error || 'Failed to accept quote')
      }
    } catch (error) {
      console.error('Error accepting quote:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-green-200 dark:border-green-900">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-300">
          <CheckCircle className="h-5 w-5" />
          Accept Quote
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="acceptedBy">Your Name *</Label>
            <Input
              id="acceptedBy"
              value={acceptedBy}
              onChange={(e) => setAcceptedBy(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>
          
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="acceptedEmail">Your Email *</Label>
            <Input
              id="acceptedEmail"
              type="email"
              value={acceptedEmail}
              onChange={(e) => setAcceptedEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          
          {/* Signature Canvas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Signature *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSignature}
              >
                <Eraser className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                width={400}
                height={150}
                className="w-full touch-none cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Please sign above using your mouse or touch screen
            </p>
          </div>
          
          {/* Terms Agreement */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="acceptedTerms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
            />
            <Label 
              htmlFor="acceptedTerms" 
              className="text-sm font-normal leading-relaxed cursor-pointer"
            >
              I have read and agree to the terms and conditions. I understand that 
              by accepting this quote, I am authorizing the work to proceed.
            </Label>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={!isValid || loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? 'Accepting...' : 'Accept & Authorize'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
