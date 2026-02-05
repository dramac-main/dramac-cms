/**
 * Loyalty Config Dialog Component
 * 
 * Phase ECOM-42B: Marketing Features - UI Components
 * 
 * Dialog for configuring the loyalty program
 */
'use client'

import { useState, useEffect } from 'react'
import { configureLoyalty } from '../../actions/marketing-actions'
import type { LoyaltyConfig } from '../../types/marketing-types'
import { Loader2, Star, Coins, Gift, Settings } from 'lucide-react'

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
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface LoyaltyConfigDialogProps {
  siteId: string
  config: LoyaltyConfig | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function LoyaltyConfigDialog({ 
  siteId, 
  config, 
  open, 
  onOpenChange, 
  onSuccess 
}: LoyaltyConfigDialogProps) {
  const [programName, setProgramName] = useState('')
  const [pointsPerDollar, setPointsPerDollar] = useState('1')
  const [redemptionRate, setRedemptionRate] = useState('100')
  const [minRedemption, setMinRedemption] = useState('100')
  const [signupBonus, setSignupBonus] = useState('0')
  const [referralBonus, setReferralBonus] = useState('0')
  const [birthdayBonus, setBirthdayBonus] = useState('0')
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!config

  // Load data when dialog opens
  useEffect(() => {
    if (open && config) {
      setProgramName(config.program_name || '')
      setPointsPerDollar(config.points_per_dollar.toString())
      setRedemptionRate(config.points_value_cents.toString())
      setMinRedemption(config.minimum_redemption.toString())
      setSignupBonus(config.signup_bonus?.toString() || '0')
      setReferralBonus(config.referral_bonus?.toString() || '0')
      setBirthdayBonus(config.review_bonus?.toString() || '0')
      setIsActive(config.is_enabled)
    } else if (open && !config) {
      // Set defaults for new config
      setProgramName('Rewards Program')
      setPointsPerDollar('1')
      setRedemptionRate('100')
      setMinRedemption('100')
      setSignupBonus('50')
      setReferralBonus('100')
      setBirthdayBonus('50')
      setIsActive(true)
    }
  }, [open, config])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const ppd = parseInt(pointsPerDollar)
    if (isNaN(ppd) || ppd < 1) {
      toast.error('Points per dollar must be at least 1')
      return
    }

    const rr = parseInt(redemptionRate)
    if (isNaN(rr) || rr < 1) {
      toast.error('Redemption rate must be at least 1')
      return
    }

    const mr = parseInt(minRedemption)
    if (isNaN(mr) || mr < 0) {
      toast.error('Minimum redemption must be 0 or greater')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await configureLoyalty(siteId, {
        is_enabled: isActive,
        program_name: programName.trim() || 'Rewards Program',
        points_per_dollar: ppd,
        points_value_cents: rr,
        minimum_redemption: mr,
        signup_bonus: parseInt(signupBonus) || 0,
        referral_bonus: parseInt(referralBonus) || 0,
        review_bonus: parseInt(birthdayBonus) || 0,
      })

      if (result.success) {
        toast.success(isEditing ? 'Loyalty program updated' : 'Loyalty program configured')
        onSuccess?.()
      } else {
        toast.error(result.error || 'Failed to save loyalty configuration')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate example earnings/redemption
  const exampleEarnings = parseInt(pointsPerDollar) * 100 // Points for $100 purchase
  const exampleRedemption = parseInt(redemptionRate) ? 
    `${parseInt(redemptionRate)} points = $1 discount` : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              {isEditing ? 'Edit Loyalty Program' : 'Configure Loyalty Program'}
            </DialogTitle>
            <DialogDescription>
              Set up how customers earn and redeem points
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Program Name */}
            <div className="grid gap-2">
              <Label htmlFor="programName">Program Name</Label>
              <Input
                id="programName"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                placeholder="Rewards Program"
              />
            </div>

            <Separator />

            {/* Earning Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-500" />
                Earning Points
              </h4>

              <div className="grid gap-2">
                <Label htmlFor="pointsPerDollar">Points per $1 Spent</Label>
                <Input
                  id="pointsPerDollar"
                  type="number"
                  min="1"
                  value={pointsPerDollar}
                  onChange={(e) => setPointsPerDollar(e.target.value)}
                />
                {!isNaN(parseInt(pointsPerDollar)) && (
                  <p className="text-xs text-muted-foreground">
                    Example: A $100 purchase earns {exampleEarnings.toLocaleString()} points
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Redemption Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Gift className="h-4 w-4 text-green-500" />
                Redeeming Points
              </h4>

              <div className="grid gap-2">
                <Label htmlFor="redemptionRate">Points per $1 Discount</Label>
                <Input
                  id="redemptionRate"
                  type="number"
                  min="1"
                  value={redemptionRate}
                  onChange={(e) => setRedemptionRate(e.target.value)}
                />
                {exampleRedemption && (
                  <p className="text-xs text-muted-foreground">{exampleRedemption}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="minRedemption">Minimum Points to Redeem</Label>
                <Input
                  id="minRedemption"
                  type="number"
                  min="0"
                  value={minRedemption}
                  onChange={(e) => setMinRedemption(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Customers need at least this many points to use them
                </p>
              </div>
            </div>

            <Separator />

            {/* Bonus Points Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Star className="h-4 w-4 text-purple-500" />
                Bonus Points
              </h4>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="signupBonus" className="text-xs">Signup Bonus</Label>
                  <Input
                    id="signupBonus"
                    type="number"
                    min="0"
                    value={signupBonus}
                    onChange={(e) => setSignupBonus(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="referralBonus" className="text-xs">Referral Bonus</Label>
                  <Input
                    id="referralBonus"
                    type="number"
                    min="0"
                    value={referralBonus}
                    onChange={(e) => setReferralBonus(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="birthdayBonus" className="text-xs">Birthday Bonus</Label>
                  <Input
                    id="birthdayBonus"
                    type="number"
                    min="0"
                    value={birthdayBonus}
                    onChange={(e) => setBirthdayBonus(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Program Active</Label>
                <p className="text-xs text-muted-foreground">
                  {isActive 
                    ? 'Customers can earn and redeem points'
                    : 'Program is paused - no points earned or redeemed'
                  }
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Program'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
