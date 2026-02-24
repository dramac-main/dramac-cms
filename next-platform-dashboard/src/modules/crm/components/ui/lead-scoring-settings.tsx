/**
 * Lead Scoring Settings Component
 * 
 * CRM Enhancement: Lead Scoring Rules Engine
 * Configure automatic lead scoring rules.
 * Industry-leader pattern: HubSpot Lead Scoring, GoHighLevel Lead Scoring
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Plus, Trash2, Zap, TrendingUp, RefreshCw, Loader2, Target,
  Star, ArrowUp, ArrowDown,
} from 'lucide-react'
import {
  getLeadScoringRules, createLeadScoringRule, updateLeadScoringRule,
  deleteLeadScoringRule, recalculateAllScores, getLeadScoringTemplates,
} from '../../actions/lead-scoring-actions'
import type { LeadScoringRule, ScoringCondition, ScoringCategory } from '../../types/crm-types'

// ============================================================================
// RULE CARD
// ============================================================================

function RuleCard({
  rule,
  onToggle,
  onDelete,
}: {
  rule: LeadScoringRule
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${
      rule.is_active ? 'bg-card' : 'bg-muted/30 opacity-60'
    }`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
          rule.points >= 0
            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
            : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
        }`}>
          {rule.points >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{rule.name}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="text-[10px]">{rule.category}</Badge>
            <span className="text-xs text-muted-foreground">
              {rule.points > 0 ? '+' : ''}{rule.points} points
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={rule.is_active}
          onCheckedChange={(checked) => onToggle(rule.id, checked)}
        />
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(rule.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// CREATE RULE DIALOG
// ============================================================================

interface CreateRuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string
  onCreated: () => void
  templates: Array<{ name: string; condition: ScoringCondition; points: number; category: ScoringCategory }>
}

function CreateRuleDialog({ open, onOpenChange, siteId, onCreated, templates }: CreateRuleDialogProps) {
  const [name, setName] = useState('')
  const [field, setField] = useState('email')
  const [operator, setOperator] = useState('is_not_empty')
  const [value, setValue] = useState('')
  const [points, setPoints] = useState(10)
  const [category, setCategory] = useState<ScoringCategory>('demographic')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Rule name is required')
      return
    }
    setSaving(true)
    try {
      await createLeadScoringRule(siteId, {
        name,
        condition: { field, operator, value },
        points,
        category,
      })
      toast.success('Scoring rule created')
      onCreated()
      onOpenChange(false)
      setName(''); setField('email'); setOperator('is_not_empty'); setValue(''); setPoints(10)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const applyTemplate = (tplName: string) => {
    const tpl = templates.find(t => t.name === tplName)
    if (!tpl) return
    setName(tpl.name)
    setField(tpl.condition.field)
    setOperator(tpl.condition.operator)
    setValue(tpl.condition.value || '')
    setPoints(tpl.points)
    setCategory(tpl.category)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Scoring Rule</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {templates.length > 0 && (
            <div>
              <Label>Quick Template</Label>
              <Select onValueChange={applyTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Use a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.name} value={t.name}>
                      {t.name} ({t.points > 0 ? '+' : ''}{t.points})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Rule Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Has Email Address" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Field</Label>
              <Select value={field} onValueChange={setField}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="lead_status">Lead Status</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="source">Source</SelectItem>
                  <SelectItem value="activity_count">Activity Count</SelectItem>
                  <SelectItem value="deal_count">Deal Count</SelectItem>
                  <SelectItem value="form_submission_count">Form Submissions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Operator</Label>
              <Select value={operator} onValueChange={setOperator}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="not_equals">Not Equals</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="greater_than">Greater Than</SelectItem>
                  <SelectItem value="less_than">Less Than</SelectItem>
                  <SelectItem value="is_empty">Is Empty</SelectItem>
                  <SelectItem value="is_not_empty">Is Not Empty</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {operator !== 'is_empty' && operator !== 'is_not_empty' && (
            <div>
              <Label>Value</Label>
              <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value to match..." />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Points</Label>
              <Input type="number" value={points} onChange={(e) => setPoints(parseInt(e.target.value) || 0)} />
              <p className="text-xs text-muted-foreground mt-1">Use negative for penalties</p>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ScoringCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demographic">Demographic</SelectItem>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                  <SelectItem value="firmographic">Firmographic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Creating...' : 'Create Rule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// MAIN SETTINGS COMPONENT
// ============================================================================

interface LeadScoringSettingsProps {
  siteId: string
  className?: string
}

export function LeadScoringSettings({ siteId, className }: LeadScoringSettingsProps) {
  const [rules, setRules] = useState<LeadScoringRule[]>([])
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [templates, setTemplates] = useState<Array<{ name: string; condition: ScoringCondition; points: number; category: ScoringCategory }>>([])

  const loadRules = useCallback(async () => {
    setLoading(true)
    try {
      const [data, tpls] = await Promise.all([
        getLeadScoringRules(siteId),
        getLeadScoringTemplates(),
      ])
      setRules(data)
      setTemplates(tpls)
    } catch (err) {
      toast.error('Failed to load scoring rules')
    } finally {
      setLoading(false)
    }
  }, [siteId])

  useEffect(() => { loadRules() }, [loadRules])

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await updateLeadScoringRule(id, { is_active: active })
      setRules(rules.map(r => r.id === id ? { ...r, is_active: active } : r))
    } catch {
      toast.error('Failed to update rule')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteLeadScoringRule(id)
      toast.success('Rule deleted')
      loadRules()
    } catch {
      toast.error('Failed to delete rule')
    }
  }

  const handleRecalculate = async () => {
    setRecalculating(true)
    try {
      const count = await recalculateAllScores(siteId)
      toast.success(`Recalculated scores for ${count} contacts`)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setRecalculating(false)
    }
  }

  if (loading) {
    return (
      <div className={className}>
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </div>
    )
  }

  const activeRules = rules.filter(r => r.is_active)
  const totalPositive = activeRules.filter(r => r.points > 0).reduce((sum, r) => sum + r.points, 0)
  const totalNegative = activeRules.filter(r => r.points < 0).reduce((sum, r) => sum + r.points, 0)

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Lead Scoring Rules
              </CardTitle>
              <CardDescription className="mt-1">
                Automatically score contacts based on attributes and behavior
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecalculate}
                disabled={recalculating}
              >
                {recalculating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Recalculate All
              </Button>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Summary */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>{activeRules.length} active rule{activeRules.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <ArrowUp className="h-4 w-4" />
              Max +{totalPositive}
            </div>
            <div className="flex items-center gap-2 text-sm text-red-600">
              <ArrowDown className="h-4 w-4" />
              {totalNegative}
            </div>
          </div>

          <Separator />

          {/* Rules List */}
          {rules.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No scoring rules yet</p>
              <p className="text-xs text-muted-foreground">Add rules to automatically score your contacts</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map(rule => (
                <RuleCard key={rule.id} rule={rule} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Rule Dialog */}
      <CreateRuleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        siteId={siteId}
        onCreated={loadRules}
        templates={templates}
      />
    </div>
  )
}
