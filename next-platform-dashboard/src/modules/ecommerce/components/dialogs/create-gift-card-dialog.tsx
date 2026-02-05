/**
 * Create Gift Card Dialog Component
 * 
 * Phase ECOM-42B: Marketing Features - UI Components
 * 
 * Dialog for issuing new gift cards
 */
'use client'

import { useState, useEffect } from 'react'
import { createGiftCard } from '../../actions/marketing-actions'
import type { GiftCardInput } from '../../types/marketing-types'
import { Loader2, Gift, Mail, User, DollarSign, Calendar } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface CreateGiftCardDialogProps {
  siteId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateGiftCardDialog({ 
  siteId, 
  open, 
  onOpenChange, 
  onSuccess 
}: CreateGiftCardDialogProps) {
  const [amount, setAmount] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [message, setMessage] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [sendEmail, setSendEmail] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  const resetForm = () => {
    setAmount('')
    setRecipientName('')
    setRecipientEmail('')
    setMessage('')
    setExpiresAt('')
    setSendEmail(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (sendEmail && !recipientEmail.trim()) {
      toast.error('Please enter recipient email to send notification')
      return
    }

    if (recipientEmail && !recipientEmail.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)

    const data: GiftCardInput = {
      initial_balance: Math.round(numAmount * 100), // Convert to cents
      recipient_name: recipientName.trim() || undefined,
      recipient_email: recipientEmail.trim() || undefined,
      personal_message: message.trim() || undefined,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    }

    try {
      const result = await createGiftCard(siteId, data)
      if (result.success && result.gift_card) {
        toast.success(
          <div className="space-y-1">
            <div className="font-medium">Gift card created!</div>
            <div className="text-sm font-mono bg-muted px-2 py-1 rounded">
              {result.gift_card.code}
            </div>
          </div>
        )
        
        // Copy code to clipboard
        navigator.clipboard.writeText(result.gift_card.code)
        
        onSuccess?.()
      } else {
        toast.error(result.error || 'Failed to create gift card')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Preset amounts
  const presetAmounts = [25, 50, 100, 250]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-500" />
              Issue Gift Card
            </DialogTitle>
            <DialogDescription>
              Create a new gift card with store credit
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Amount */}
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                {presetAmounts.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(preset.toString())}
                    className="flex-1"
                  >
                    ${preset}
                  </Button>
                ))}
              </div>
            </div>

            {/* Recipient Name */}
            <div className="grid gap-2">
              <Label htmlFor="recipientName">Recipient Name (optional)</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="recipientName"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="John Doe"
                  className="pl-9"
                />
              </div>
            </div>

            {/* Recipient Email */}
            <div className="grid gap-2">
              <Label htmlFor="recipientEmail">Recipient Email (optional)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="recipientEmail"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="pl-9"
                />
              </div>
            </div>

            {/* Personal Message */}
            <div className="grid gap-2">
              <Label htmlFor="message">Personal Message (optional)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enjoy your gift card!"
                rows={2}
              />
            </div>

            {/* Expiration Date */}
            <div className="grid gap-2">
              <Label htmlFor="expiresAt">Expiration Date (optional)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="expiresAt"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="pl-9"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty for no expiration
              </p>
            </div>

            {/* Send Email Toggle - Future feature */}
            {/* 
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Send Email Notification</Label>
                <p className="text-xs text-muted-foreground">
                  Email the gift card code to the recipient
                </p>
              </div>
              <Switch
                checked={sendEmail}
                onCheckedChange={setSendEmail}
                disabled={!recipientEmail}
              />
            </div>
            */}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Issue Gift Card
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
