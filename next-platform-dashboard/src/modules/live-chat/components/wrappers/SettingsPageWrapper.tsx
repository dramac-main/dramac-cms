'use client'

/**
 * SettingsPageWrapper — Full widget settings with 8-tab interface
 *
 * PHASE LC-04: Appearance, Branding, Pre-Chat, Business Hours,
 * Behavior, Embed Code, WhatsApp, Advanced
 */

import { useState, useCallback, useTransition } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Palette,
  Building2,
  MessageSquare,
  Clock,
  Settings2,
  Code2,
  Smartphone,
  Shield,
  Save,
  Check,
  Copy,
  Eye,
  AlertCircle,
} from 'lucide-react'
import { updateWidgetSettings } from '@/modules/live-chat/actions'
import type { ChatWidgetSettings, ChatDepartment, BusinessHoursConfig } from '@/modules/live-chat/types'

interface SettingsPageWrapperProps {
  siteId: string
  initialSettings: ChatWidgetSettings
  departments: (ChatDepartment & { agentCount: number })[]
}

type FormData = Record<string, unknown>

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const

const POSITION_OPTIONS = [
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
]

const ICON_OPTIONS = [
  { value: 'chat', label: '💬 Chat Bubble' },
  { value: 'support', label: '🎧 Headset' },
  { value: 'wave', label: '👋 Wave' },
  { value: 'help', label: '❓ Help' },
]

export function SettingsPageWrapper({
  siteId,
  initialSettings,
  departments,
}: SettingsPageWrapperProps) {
  const [settings, setSettings] = useState<ChatWidgetSettings>(initialSettings)
  const [isPending, startTransition] = useTransition()
  const [savedTab, setSavedTab] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const update = useCallback(
    (key: keyof ChatWidgetSettings, value: unknown) => {
      setSettings((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const updateBusinessHours = useCallback(
    (day: string, field: string, value: unknown) => {
      setSettings((prev) => {
        const hours = { ...(prev.businessHours || {}) } as Record<string, { enabled: boolean; start: string; end: string }>
        const currentDay = hours[day] || { enabled: false, start: '09:00', end: '17:00' }
        hours[day] = { ...currentDay, [field]: value }
        return { ...prev, businessHours: hours as unknown as BusinessHoursConfig }
      })
    },
    []
  )

  const saveSettings = useCallback(
    (tabName: string, fields: FormData) => {
      setError(null)
      startTransition(async () => {
        const result = await updateWidgetSettings(siteId, fields)
        if (result.error) {
          setError(result.error)
        } else {
          setSavedTab(tabName)
          setTimeout(() => setSavedTab(null), 2000)
        }
      })
    },
    [siteId]
  )

  const getEmbedCode = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'
    return `<!-- DRAMAC Live Chat Widget -->
<script>
(function(d,r,a,m){
  m=d.createElement('script');
  m.src='${origin}/api/modules/live-chat/embed?siteId=${siteId}';
  m.async=true;
  d.head.appendChild(m);
})(document);
</script>`
  }

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(getEmbedCode())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="container py-6 max-w-5xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Widget Settings</h2>
        <p className="text-muted-foreground">
          Configure your live chat widget appearance, behavior, and integrations
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-1 h-auto p-1">
          <TabsTrigger value="appearance" className="text-xs gap-1">
            <Palette className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="text-xs gap-1">
            <Building2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Branding</span>
          </TabsTrigger>
          <TabsTrigger value="pre-chat" className="text-xs gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Pre-Chat</span>
          </TabsTrigger>
          <TabsTrigger value="hours" className="text-xs gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Hours</span>
          </TabsTrigger>
          <TabsTrigger value="behavior" className="text-xs gap-1">
            <Settings2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Behavior</span>
          </TabsTrigger>
          <TabsTrigger value="embed" className="text-xs gap-1">
            <Code2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Embed</span>
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="text-xs gap-1">
            <Smartphone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs gap-1">
            <Shield className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Advanced</span>
          </TabsTrigger>
        </TabsList>

        {/* ──────────── APPEARANCE ──────────── */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your chat widget
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Primary Color */}
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => update('primaryColor', e.target.value)}
                      className="w-10 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={settings.primaryColor}
                      onChange={(e) => update('primaryColor', e.target.value)}
                      placeholder="#6366f1"
                    />
                  </div>
                </div>

                {/* Text Color */}
                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.textColor}
                      onChange={(e) => update('textColor', e.target.value)}
                      className="w-10 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={settings.textColor}
                      onChange={(e) => update('textColor', e.target.value)}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                {/* Position */}
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select
                    value={settings.position}
                    onValueChange={(v) => update('position', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Launcher Icon */}
                <div className="space-y-2">
                  <Label>Launcher Icon</Label>
                  <Select
                    value={settings.launcherIcon}
                    onValueChange={(v) => update('launcherIcon', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Launcher Size */}
                <div className="space-y-2">
                  <Label>Launcher Size (px)</Label>
                  <Input
                    type="number"
                    value={settings.launcherSize}
                    onChange={(e) => update('launcherSize', parseInt(e.target.value) || 56)}
                    min={40}
                    max={80}
                  />
                </div>

                {/* Border Radius */}
                <div className="space-y-2">
                  <Label>Border Radius (px)</Label>
                  <Input
                    type="number"
                    value={settings.borderRadius}
                    onChange={(e) => update('borderRadius', parseInt(e.target.value) || 16)}
                    min={0}
                    max={24}
                  />
                </div>

                {/* Z-Index */}
                <div className="space-y-2">
                  <Label>Z-Index</Label>
                  <Input
                    type="number"
                    value={settings.zIndex}
                    onChange={(e) => update('zIndex', parseInt(e.target.value) || 99999)}
                    min={1000}
                    max={999999}
                  />
                </div>
              </div>

              {/* Widget Preview */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <Label className="text-xs text-muted-foreground mb-3 block">
                  <Eye className="h-3.5 w-3.5 inline mr-1" />
                  Preview
                </Label>
                <div className="relative h-16 flex items-end" style={{
                  justifyContent: settings.position === 'bottom-right' ? 'flex-end' : 'flex-start'
                }}>
                  <div
                    className="flex items-center justify-center shadow-lg transition-all"
                    style={{
                      width: settings.launcherSize,
                      height: settings.launcherSize,
                      borderRadius: '50%',
                      backgroundColor: settings.primaryColor,
                      color: settings.textColor,
                    }}
                  >
                    <MessageSquare className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <Button
                onClick={() =>
                  saveSettings('appearance', {
                    primaryColor: settings.primaryColor,
                    textColor: settings.textColor,
                    position: settings.position,
                    launcherIcon: settings.launcherIcon,
                    launcherSize: settings.launcherSize,
                    borderRadius: settings.borderRadius,
                    zIndex: settings.zIndex,
                  })
                }
                disabled={isPending}
              >
                {savedTab === 'appearance' ? (
                  <><Check className="h-4 w-4 mr-2" /> Saved</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> Save Appearance</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──────────── BRANDING ──────────── */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Branding & Messages
              </CardTitle>
              <CardDescription>
                Set your company name, logo, and chat messages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  value={settings.companyName || ''}
                  onChange={(e) => update('companyName', e.target.value || null)}
                  placeholder="DRAMAC Support"
                />
              </div>

              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input
                  value={settings.logoUrl || ''}
                  onChange={(e) => update('logoUrl', e.target.value || null)}
                  placeholder="https://example.com/logo.png"
                />
                {settings.logoUrl && (
                  <div className="flex items-center gap-2 mt-2">
                    <img
                      src={settings.logoUrl}
                      alt="Logo preview"
                      className="h-10 w-10 rounded-full object-cover border"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <span className="text-xs text-muted-foreground">Logo preview</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Welcome Message</Label>
                <Textarea
                  value={settings.welcomeMessage}
                  onChange={(e) => update('welcomeMessage', e.target.value)}
                  placeholder="Hi there! How can we help you today?"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Shown when the chat widget is opened (during business hours)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Away Message</Label>
                <Textarea
                  value={settings.awayMessage}
                  onChange={(e) => update('awayMessage', e.target.value)}
                  placeholder="We're currently busy. We'll respond shortly."
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Shown when all agents are busy or away
                </p>
              </div>

              <div className="space-y-2">
                <Label>Offline Message</Label>
                <Textarea
                  value={settings.offlineMessage}
                  onChange={(e) => update('offlineMessage', e.target.value)}
                  placeholder="We're currently offline. Leave us a message and we'll get back to you."
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Shown when outside business hours
                </p>
              </div>

              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={settings.language}
                  onValueChange={(v) => update('language', v)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="sw">Swahili</SelectItem>
                    <SelectItem value="ny">Nyanja</SelectItem>
                    <SelectItem value="bem">Bemba</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() =>
                  saveSettings('branding', {
                    companyName: settings.companyName,
                    logoUrl: settings.logoUrl,
                    welcomeMessage: settings.welcomeMessage,
                    awayMessage: settings.awayMessage,
                    offlineMessage: settings.offlineMessage,
                    language: settings.language,
                  })
                }
                disabled={isPending}
              >
                {savedTab === 'branding' ? (
                  <><Check className="h-4 w-4 mr-2" /> Saved</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> Save Branding</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──────────── PRE-CHAT ──────────── */}
        <TabsContent value="pre-chat">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Pre-Chat Form
              </CardTitle>
              <CardDescription>
                Configure what information to collect before starting a chat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Pre-Chat Form</Label>
                  <p className="text-xs text-muted-foreground">
                    Collect visitor info before the chat begins
                  </p>
                </div>
                <Switch
                  checked={settings.preChatEnabled}
                  onCheckedChange={(v) => update('preChatEnabled', v)}
                />
              </div>

              {settings.preChatEnabled && (
                <div className="space-y-4 pl-2 border-l-2 border-muted ml-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Name Required</Label>
                      <p className="text-xs text-muted-foreground">
                        Visitor must provide their name
                      </p>
                    </div>
                    <Switch
                      checked={settings.preChatNameRequired}
                      onCheckedChange={(v) => update('preChatNameRequired', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Required</Label>
                      <p className="text-xs text-muted-foreground">
                        Visitor must provide their email
                      </p>
                    </div>
                    <Switch
                      checked={settings.preChatEmailRequired}
                      onCheckedChange={(v) => update('preChatEmailRequired', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Phone Field</Label>
                      <p className="text-xs text-muted-foreground">
                        Display phone number field in pre-chat form
                      </p>
                    </div>
                    <Switch
                      checked={settings.preChatPhoneEnabled}
                      onCheckedChange={(v) => update('preChatPhoneEnabled', v)}
                    />
                  </div>

                  {settings.preChatPhoneEnabled && (
                    <div className="flex items-center justify-between ml-4">
                      <div>
                        <Label>Phone Required</Label>
                        <p className="text-xs text-muted-foreground">
                          Make phone number mandatory
                        </p>
                      </div>
                      <Switch
                        checked={settings.preChatPhoneRequired}
                        onCheckedChange={(v) => update('preChatPhoneRequired', v)}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Message Required</Label>
                      <p className="text-xs text-muted-foreground">
                        Visitor must include a message
                      </p>
                    </div>
                    <Switch
                      checked={settings.preChatMessageRequired}
                      onCheckedChange={(v) => update('preChatMessageRequired', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Department Selector</Label>
                      <p className="text-xs text-muted-foreground">
                        Let visitors choose a department
                        {departments.length > 0 && (
                          <> ({departments.length} department{departments.length > 1 ? 's' : ''} available)</>
                        )}
                      </p>
                    </div>
                    <Switch
                      checked={settings.preChatDepartmentSelector}
                      onCheckedChange={(v) => update('preChatDepartmentSelector', v)}
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={() =>
                  saveSettings('pre-chat', {
                    preChatEnabled: settings.preChatEnabled,
                    preChatNameRequired: settings.preChatNameRequired,
                    preChatEmailRequired: settings.preChatEmailRequired,
                    preChatPhoneEnabled: settings.preChatPhoneEnabled,
                    preChatPhoneRequired: settings.preChatPhoneRequired,
                    preChatMessageRequired: settings.preChatMessageRequired,
                    preChatDepartmentSelector: settings.preChatDepartmentSelector,
                  })
                }
                disabled={isPending}
              >
                {savedTab === 'pre-chat' ? (
                  <><Check className="h-4 w-4 mr-2" /> Saved</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> Save Pre-Chat</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──────────── BUSINESS HOURS ──────────── */}
        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Business Hours
              </CardTitle>
              <CardDescription>
                Set your availability schedule. Outside these hours, visitors see the offline form.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Business Hours</Label>
                  <p className="text-xs text-muted-foreground">
                    When disabled, the widget is always available
                  </p>
                </div>
                <Switch
                  checked={settings.businessHoursEnabled}
                  onCheckedChange={(v) => update('businessHoursEnabled', v)}
                />
              </div>

              {settings.businessHoursEnabled && (
                <>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Input
                      value={settings.timezone}
                      onChange={(e) => update('timezone', e.target.value)}
                      placeholder="Africa/Lusaka"
                    />
                    <p className="text-xs text-muted-foreground">
                      IANA timezone identifier (e.g., Africa/Lusaka, Europe/London)
                    </p>
                  </div>

                  <div className="space-y-3">
                    {DAYS_OF_WEEK.map(({ key, label }) => {
                      const dayConfig = settings.businessHours?.[key as keyof BusinessHoursConfig]
                      const isEnabled = dayConfig?.enabled ?? false
                      const start = dayConfig?.start ?? '09:00'
                      const end = dayConfig?.end ?? '17:00'

                      return (
                        <div
                          key={key}
                          className="flex items-center gap-4 py-2 border-b last:border-0"
                        >
                          <div className="w-28">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={isEnabled}
                                onCheckedChange={(v) =>
                                  updateBusinessHours(key, 'enabled', v)
                                }
                              />
                              <span className="text-sm font-medium">{label}</span>
                            </div>
                          </div>

                          {isEnabled ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="time"
                                value={start}
                                onChange={(e) =>
                                  updateBusinessHours(key, 'start', e.target.value)
                                }
                                className="w-32"
                              />
                              <span className="text-muted-foreground">to</span>
                              <Input
                                type="time"
                                value={end}
                                onChange={(e) =>
                                  updateBusinessHours(key, 'end', e.target.value)
                                }
                                className="w-32"
                              />
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Closed
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              <Button
                onClick={() =>
                  saveSettings('hours', {
                    businessHoursEnabled: settings.businessHoursEnabled,
                    businessHours: settings.businessHours,
                    timezone: settings.timezone,
                  })
                }
                disabled={isPending}
              >
                {savedTab === 'hours' ? (
                  <><Check className="h-4 w-4 mr-2" /> Saved</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> Save Hours</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──────────── BEHAVIOR ──────────── */}
        <TabsContent value="behavior">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Behavior
              </CardTitle>
              <CardDescription>
                Control widget behavior and feature toggles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Auto-Open Delay (seconds)</Label>
                <Input
                  type="number"
                  value={settings.autoOpenDelaySeconds}
                  onChange={(e) =>
                    update('autoOpenDelaySeconds', parseInt(e.target.value) || 0)
                  }
                  min={0}
                  max={300}
                />
                <p className="text-xs text-muted-foreground">
                  Automatically open the widget after this delay (0 = disabled)
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    key: 'showAgentAvatar' as const,
                    label: 'Show Agent Avatar',
                    desc: 'Display agent profile photos in chat',
                  },
                  {
                    key: 'showAgentName' as const,
                    label: 'Show Agent Name',
                    desc: 'Display agent names in messages',
                  },
                  {
                    key: 'showTypingIndicator' as const,
                    label: 'Typing Indicator',
                    desc: 'Show when an agent is typing',
                  },
                  {
                    key: 'enableFileUploads' as const,
                    label: 'File Uploads',
                    desc: 'Allow visitors to upload files',
                  },
                  {
                    key: 'enableEmoji' as const,
                    label: 'Emoji',
                    desc: 'Enable emoji picker in chat',
                  },
                  {
                    key: 'enableSoundNotifications' as const,
                    label: 'Sound Notifications',
                    desc: 'Play sound for new messages',
                  },
                  {
                    key: 'enableSatisfactionRating' as const,
                    label: 'Satisfaction Rating',
                    desc: 'Show rating form after chat ends',
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <Label>{item.label}</Label>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={settings[item.key] as boolean}
                      onCheckedChange={(v) => update(item.key, v)}
                    />
                  </div>
                ))}
              </div>

              {/* ── Auto-Close Inactive Conversations ── */}
              <div className="border-t pt-6 mt-6">
                <h4 className="font-medium mb-4">Auto-Close Inactive Conversations</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Auto-Close</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically close conversations after inactivity
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoCloseEnabled ?? true}
                      onCheckedChange={(v) => update('autoCloseEnabled', v)}
                    />
                  </div>

                  {(settings.autoCloseEnabled ?? true) && (
                    <>
                      <div className="space-y-2">
                        <Label>Inactivity Timeout (minutes)</Label>
                        <Input
                          type="number"
                          value={settings.autoCloseMinutes ?? 30}
                          onChange={(e) =>
                            update('autoCloseMinutes', parseInt(e.target.value) || 30)
                          }
                          min={5}
                          max={1440}
                        />
                        <p className="text-xs text-muted-foreground">
                          Close conversations after this many minutes of no messages (5–1440)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Auto-Close Message</Label>
                        <Input
                          value={settings.autoCloseMessage ?? 'This conversation was automatically closed due to inactivity. Feel free to start a new chat anytime!'}
                          onChange={(e) => update('autoCloseMessage', e.target.value)}
                          placeholder="Message shown when conversation is auto-closed"
                        />
                        <p className="text-xs text-muted-foreground">
                          System message sent when a conversation is automatically closed
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Button
                onClick={() =>
                  saveSettings('behavior', {
                    autoOpenDelaySeconds: settings.autoOpenDelaySeconds,
                    showAgentAvatar: settings.showAgentAvatar,
                    showAgentName: settings.showAgentName,
                    showTypingIndicator: settings.showTypingIndicator,
                    enableFileUploads: settings.enableFileUploads,
                    enableEmoji: settings.enableEmoji,
                    enableSoundNotifications: settings.enableSoundNotifications,
                    enableSatisfactionRating: settings.enableSatisfactionRating,
                    autoCloseEnabled: settings.autoCloseEnabled ?? true,
                    autoCloseMinutes: settings.autoCloseMinutes ?? 30,
                    autoCloseMessage: settings.autoCloseMessage ?? 'This conversation was automatically closed due to inactivity. Feel free to start a new chat anytime!',
                  })
                }
                disabled={isPending}
              >
                {savedTab === 'behavior' ? (
                  <><Check className="h-4 w-4 mr-2" /> Saved</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> Save Behavior</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──────────── EMBED CODE ──────────── */}
        <TabsContent value="embed">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                Embed Code
              </CardTitle>
              <CardDescription>
                Copy and paste this code into your website to add the chat widget
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Installation Code</Label>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{getEmbedCode()}</code>
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={copyEmbedCode}
                  >
                    {copied ? (
                      <><Check className="h-3.5 w-3.5 mr-1" /> Copied</>
                    ) : (
                      <><Copy className="h-3.5 w-3.5 mr-1" /> Copy</>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add this snippet before the closing <code>&lt;/body&gt;</code> tag on your website.
                  The widget will load asynchronously and won&apos;t affect page load speed.
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="text-sm font-medium mb-2">Alternative: Direct iframe</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  If you prefer manual control, you can embed the widget via iframe:
                </p>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                  <code>{`<iframe
  src="${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/embed/chat-widget?siteId=${siteId}"
  style="position:fixed;bottom:0;right:0;width:400px;height:600px;border:none;z-index:99999"
  allow="clipboard-write"
></iframe>`}</code>
                </pre>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2">Platform-Specific Guides</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>WordPress:</strong> Add the snippet to your theme&apos;s footer.php or use a &quot;Header/Footer Scripts&quot; plugin.</p>
                  <p><strong>Shopify:</strong> Go to Online Store → Themes → Edit Code → theme.liquid, paste before &lt;/body&gt;.</p>
                  <p><strong>Webflow:</strong> Project Settings → Custom Code → Footer Code.</p>
                  <p><strong>Squarespace:</strong> Settings → Advanced → Code Injection → Footer.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──────────── WHATSAPP ──────────── */}
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                WhatsApp Integration
                <Badge variant="secondary" className="text-[10px]">Phase LC-05</Badge>
              </CardTitle>
              <CardDescription>
                Connect WhatsApp Business to receive and send messages through DRAMAC
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable WhatsApp</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow customers to reach you via WhatsApp
                  </p>
                </div>
                <Switch
                  checked={settings.whatsappEnabled}
                  onCheckedChange={(v) => update('whatsappEnabled', v)}
                />
              </div>

              {settings.whatsappEnabled && (
                <div className="space-y-4 pl-2 border-l-2 border-muted ml-1">
                  <div className="space-y-2">
                    <Label>WhatsApp Phone Number</Label>
                    <Input
                      value={settings.whatsappPhoneNumber || ''}
                      onChange={(e) =>
                        update('whatsappPhoneNumber', e.target.value || null)
                      }
                      placeholder="+260 97X XXX XXX"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your WhatsApp Business phone number
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Phone Number ID</Label>
                    <Input
                      value={settings.whatsappPhoneNumberId || ''}
                      onChange={(e) =>
                        update('whatsappPhoneNumberId', e.target.value || null)
                      }
                      placeholder="Meta Cloud API Phone Number ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Business Account ID</Label>
                    <Input
                      value={settings.whatsappBusinessAccountId || ''}
                      onChange={(e) =>
                        update(
                          'whatsappBusinessAccountId',
                          e.target.value || null
                        )
                      }
                      placeholder="Meta Business Account ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Welcome Template</Label>
                    <Input
                      value={settings.whatsappWelcomeTemplate || ''}
                      onChange={(e) =>
                        update(
                          'whatsappWelcomeTemplate',
                          e.target.value || null
                        )
                      }
                      placeholder="hello_world"
                    />
                    <p className="text-xs text-muted-foreground">
                      Approved message template for initial outbound messages
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={() =>
                  saveSettings('whatsapp', {
                    whatsappEnabled: settings.whatsappEnabled,
                    whatsappPhoneNumber: settings.whatsappPhoneNumber,
                    whatsappPhoneNumberId: settings.whatsappPhoneNumberId,
                    whatsappBusinessAccountId: settings.whatsappBusinessAccountId,
                    whatsappWelcomeTemplate: settings.whatsappWelcomeTemplate,
                  })
                }
                disabled={isPending}
              >
                {savedTab === 'whatsapp' ? (
                  <><Check className="h-4 w-4 mr-2" /> Saved</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> Save WhatsApp</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──────────── ADVANCED ──────────── */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>
                Security, file upload limits, and domain restrictions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Allowed Domains</Label>
                <Textarea
                  value={(settings.allowedDomains || []).join('\n')}
                  onChange={(e) =>
                    update(
                      'allowedDomains',
                      e.target.value
                        .split('\n')
                        .map((d) => d.trim())
                        .filter(Boolean)
                    )
                  }
                  placeholder="example.com&#10;app.example.com"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  One domain per line. Leave empty to allow all domains.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Blocked IP Addresses</Label>
                <Textarea
                  value={(settings.blockedIps || []).join('\n')}
                  onChange={(e) =>
                    update(
                      'blockedIps',
                      e.target.value
                        .split('\n')
                        .map((ip) => ip.trim())
                        .filter(Boolean)
                    )
                  }
                  placeholder="192.168.1.1&#10;10.0.0.0/8"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  One IP or CIDR per line. These IPs will be blocked from using the widget.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Max File Size (MB)</Label>
                  <Input
                    type="number"
                    value={settings.maxFileSizeMb}
                    onChange={(e) =>
                      update('maxFileSizeMb', parseInt(e.target.value) || 5)
                    }
                    min={1}
                    max={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Allowed File Types</Label>
                  <Input
                    value={(settings.allowedFileTypes || []).join(', ')}
                    onChange={(e) =>
                      update(
                        'allowedFileTypes',
                        e.target.value
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean)
                      )
                    }
                    placeholder="image/*, .pdf, .doc, .docx"
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated MIME types or extensions
                  </p>
                </div>
              </div>

              <Button
                onClick={() =>
                  saveSettings('advanced', {
                    allowedDomains: settings.allowedDomains,
                    blockedIps: settings.blockedIps,
                    maxFileSizeMb: settings.maxFileSizeMb,
                    allowedFileTypes: settings.allowedFileTypes,
                  })
                }
                disabled={isPending}
              >
                {savedTab === 'advanced' ? (
                  <><Check className="h-4 w-4 mr-2" /> Saved</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> Save Advanced</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
