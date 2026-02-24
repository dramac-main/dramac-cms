/**
 * Email Compose Dialog
 * 
 * CRM Enhancement: Send emails directly from CRM
 * Compose and send emails to contacts with template support.
 * Industry-leader pattern: HubSpot Email, GoHighLevel Conversations
 */
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Mail, Send, FileText, Loader2, Sparkles } from 'lucide-react'
import { sendCrmEmail, getEmailTemplates } from '../../actions/email-actions'
import type { Contact } from '../../types/crm-types'

interface EmailComposeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: Contact | null
  siteId: string
  onSent?: () => void
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
}

export function EmailComposeDialog({ open, onOpenChange, contact, siteId, onSent }: EmailComposeDialogProps) {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  useEffect(() => {
    if (open && contact) {
      setTo(contact.email || '')
      setSubject('')
      setBody('')
      loadTemplates()
    }
  }, [open, contact])

  const loadTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const data = await getEmailTemplates(siteId)
      setTemplates(data)
    } catch {
      // Templates are optional
    } finally {
      setLoadingTemplates(false)
    }
  }

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    // Replace merge tags
    let processedSubject = template.subject
    let processedBody = template.body

    if (contact) {
      const mergeData: Record<string, string> = {
        '{{first_name}}': contact.first_name || '',
        '{{last_name}}': contact.last_name || '',
        '{{full_name}}': `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
        '{{email}}': contact.email || '',
        '{{company}}': contact.company || '',
        '{{phone}}': contact.phone || '',
      }

      for (const [tag, value] of Object.entries(mergeData)) {
        processedSubject = processedSubject.replace(new RegExp(tag.replace(/[{}]/g, '\\$&'), 'g'), value)
        processedBody = processedBody.replace(new RegExp(tag.replace(/[{}]/g, '\\$&'), 'g'), value)
      }
    }

    setSubject(processedSubject)
    setBody(processedBody)
    toast.success('Template applied')
  }

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setSending(true)
    try {
      const result = await sendCrmEmail(siteId, {
        to,
        subject,
        body,
        contactId: contact?.id,
      })

      if (result.success) {
        toast.success('Email sent successfully')
        onOpenChange(false)
        onSent?.()
      } else {
        toast.error(result.error || 'Failed to send email')
      }
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Compose Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* To */}
          <div>
            <Label>To</Label>
            <div className="flex items-center gap-2">
              <Input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                type="email"
                className="flex-1"
              />
              {contact && (
                <Badge variant="outline" className="whitespace-nowrap">
                  {contact.first_name} {contact.last_name}
                </Badge>
              )}
            </div>
          </div>

          {/* Template Selector */}
          {templates.length > 0 && (
            <div>
              <Label className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Use Template
              </Label>
              <Select onValueChange={applyTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        {t.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subject */}
          <div>
            <Label>Subject *</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line..."
            />
          </div>

          {/* Body */}
          <div>
            <Label>Message *</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email message..."
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Merge tags: {'{{first_name}}'}, {'{{last_name}}'}, {'{{company}}'}, {'{{email}}'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
