'use client'

/**
 * Template Message Dialog
 *
 * PHASE LC-05: Dialog for selecting and sending WhatsApp template messages.
 * Used when the 24-hour service window has expired.
 */

import { useState, useEffect, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Loader2, FileText, Send, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { getWhatsAppTemplates, sendWhatsAppTemplateMessage } from '@/modules/live-chat/actions/whatsapp-actions'

interface TemplateMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId: string
  siteId: string
  senderId: string
}

interface Template {
  name: string
  language: string
  status: string
  components: unknown[]
}

export function TemplateMessageDialog({
  open,
  onOpenChange,
  conversationId,
  siteId,
  senderId,
}: TemplateMessageDialogProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [parameters, setParameters] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Fetch templates when dialog opens
  useEffect(() => {
    if (!open) return

    setLoading(true)
    getWhatsAppTemplates(siteId)
      .then(({ templates: t, error }) => {
        if (error) {
          toast.error(error)
          return
        }
        setTemplates(t.filter((tmpl) => tmpl.status === 'APPROVED'))
      })
      .finally(() => setLoading(false))
  }, [open, siteId])

  const handleSend = () => {
    if (!selectedTemplate) return

    startTransition(async () => {
      const components = selectedTemplate.components
        .filter((c: any) => c.type === 'body' || c.type === 'header')
        .map((c: any) => {
          const params = Object.entries(parameters)
            .filter(([key]) => key.startsWith(`${c.type}_`))
            .map(([, value]) => ({ type: 'text' as const, text: value }))

          return params.length > 0
            ? { type: c.type, parameters: params }
            : null
        })
        .filter(Boolean)

      const { error } = await sendWhatsAppTemplateMessage(
        conversationId,
        {
          name: selectedTemplate.name,
          language: { code: selectedTemplate.language },
          components: components.length > 0 ? components as any : undefined,
        },
        senderId
      )

      if (error) {
        toast.error(error)
      } else {
        toast.success('Template message sent')
        onOpenChange(false)
        setSelectedTemplate(null)
        setParameters({})
      }
    })
  }

  // Extract parameter count from template body
  const getParameterCount = (template: Template): number => {
    let count = 0
    for (const comp of template.components as any[]) {
      if (comp.type === 'body' && comp.text) {
        const matches = comp.text.match(/\{\{\d+\}\}/g)
        count += matches?.length || 0
      }
    }
    return count
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Send Template Message
          </DialogTitle>
          <DialogDescription>
            The 24-hour service window has expired. Select an approved template to continue the conversation.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No approved templates found. Create templates in your Meta Business Suite.
            </p>
          </div>
        ) : !selectedTemplate ? (
          <ScrollArea className="max-h-64">
            <div className="space-y-2">
              {templates.map((tmpl) => (
                <button
                  key={`${tmpl.name}-${tmpl.language}`}
                  type="button"
                  className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedTemplate(tmpl)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{tmpl.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {tmpl.language}
                    </Badge>
                  </div>
                  {(tmpl.components as any[])
                    .filter((c) => c.type === 'body')
                    .map((c, i) => (
                      <p key={i} className="text-xs text-muted-foreground truncate">
                        {c.text}
                      </p>
                    ))}
                </button>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{selectedTemplate.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedTemplate(null)
                    setParameters({})
                  }}
                >
                  Change
                </Button>
              </div>
              {(selectedTemplate.components as any[])
                .filter((c) => c.type === 'body')
                .map((c, i) => (
                  <p key={i} className="text-sm text-muted-foreground">
                    {c.text}
                  </p>
                ))}
            </div>

            {getParameterCount(selectedTemplate) > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Parameters</Label>
                {Array.from({ length: getParameterCount(selectedTemplate) }).map(
                  (_, i) => (
                    <div key={i}>
                      <Label className="text-xs text-muted-foreground">
                        {`{{${i + 1}}}`}
                      </Label>
                      <Input
                        value={parameters[`body_${i}`] || ''}
                        onChange={(e) =>
                          setParameters((prev) => ({
                            ...prev,
                            [`body_${i}`]: e.target.value,
                          }))
                        }
                        placeholder={`Parameter ${i + 1}`}
                        className="mt-1"
                      />
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!selectedTemplate || isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
