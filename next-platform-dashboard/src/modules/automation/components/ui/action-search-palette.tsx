/**
 * ActionSearchPalette Component
 * 
 * PHASE-UI-12A: Automation Workflow Builder UI
 * 
 * Command palette style action search with fuzzy search,
 * recent actions, category filters, and keyboard navigation.
 */

"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Search,
  History,
  Mail,
  User,
  Database,
  GitBranch,
  Repeat,
  Webhook,
  Bot,
  ChevronRight,
  icons,
} from "lucide-react"

// ============================================================================
// TYPES
// ============================================================================

interface ActionItem {
  id: string
  name: string
  description: string
  category: string
  icon: string
  isRecent?: boolean
  isFavorite?: boolean
}

interface ActionSearchPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectAction: (action: ActionItem) => void
  recentActions?: string[]
  favoriteActions?: string[]
}

// ============================================================================
// ACTION CATEGORIES DATA
// ============================================================================

const ACTION_CATEGORIES = [
  {
    id: "crm",
    name: "CRM",
    icon: User,
    color: "text-emerald-500",
    actions: [
      { id: "crm.create_contact", name: "Create Contact", description: "Add a new contact to CRM", icon: "UserPlus" },
      { id: "crm.update_contact", name: "Update Contact", description: "Modify contact fields", icon: "Pencil" },
      { id: "crm.add_tag", name: "Add Tag", description: "Add tag to contact", icon: "Tag" },
      { id: "crm.remove_tag", name: "Remove Tag", description: "Remove tag from contact", icon: "Tag" },
      { id: "crm.create_deal", name: "Create Deal", description: "Create new deal/opportunity", icon: "CircleDollarSign" },
      { id: "crm.move_deal_stage", name: "Move Deal Stage", description: "Move deal to different stage", icon: "ArrowRight" },
      { id: "crm.create_task", name: "Create Task", description: "Create a follow-up task", icon: "CircleCheck" },
      { id: "crm.log_activity", name: "Log Activity", description: "Log call, meeting, or note", icon: "FileText" },
      { id: "crm.find_contact", name: "Find Contact", description: "Find contact by field", icon: "Search" },
    ],
  },
  {
    id: "communication",
    name: "Communication",
    icon: Mail,
    color: "text-blue-500",
    actions: [
      { id: "email.send", name: "Send Email", description: "Send a custom email", icon: "Mail" },
      { id: "email.send_template", name: "Send Template Email", description: "Send from template", icon: "MailOpen" },
      { id: "notification.send_sms", name: "Send SMS", description: "Send SMS message", icon: "Smartphone" },
      { id: "notification.send_slack", name: "Send to Slack", description: "Post to Slack channel", icon: "MessageSquare" },
      { id: "notification.send_discord", name: "Send to Discord", description: "Post to Discord", icon: "Gamepad2" },
      { id: "notification.in_app", name: "In-App Notification", description: "Send in-app alert", icon: "Bell" },
    ],
  },
  {
    id: "data",
    name: "Data",
    icon: Database,
    color: "text-orange-500",
    actions: [
      { id: "data.lookup", name: "Lookup Record", description: "Find a database record", icon: "Search" },
      { id: "data.create", name: "Create Record", description: "Insert new record", icon: "Plus" },
      { id: "data.update", name: "Update Record", description: "Update existing record", icon: "Pencil" },
      { id: "data.delete", name: "Delete Record", description: "Remove a record", icon: "Trash2" },
    ],
  },
  {
    id: "flow",
    name: "Flow Control",
    icon: GitBranch,
    color: "text-amber-500",
    actions: [
      { id: "flow.delay", name: "Delay", description: "Wait before continuing", icon: "Timer" },
      { id: "flow.condition", name: "Condition (If/Else)", description: "Branch based on condition", icon: "GitBranch" },
      { id: "flow.loop", name: "Loop", description: "Repeat for each item", icon: "Repeat" },
      { id: "flow.stop", name: "Stop Workflow", description: "End workflow execution", icon: "StopCircle" },
    ],
  },
  {
    id: "transform",
    name: "Transform",
    icon: Repeat,
    color: "text-purple-500",
    actions: [
      { id: "transform.map", name: "Map Data", description: "Transform data shape", icon: "RefreshCw" },
      { id: "transform.filter", name: "Filter Array", description: "Filter items in array", icon: "Search" },
      { id: "transform.aggregate", name: "Aggregate", description: "Sum, count, average", icon: "ChartBar" },
      { id: "transform.format_date", name: "Format Date", description: "Format date/time", icon: "Calendar" },
      { id: "transform.template", name: "Render Template", description: "Generate text from template", icon: "FileText" },
    ],
  },
  {
    id: "external",
    name: "External",
    icon: Webhook,
    color: "text-cyan-500",
    actions: [
      { id: "webhook.send", name: "HTTP Request", description: "Call external API", icon: "Globe" },
      { id: "integration.google_sheets", name: "Google Sheets", description: "Add row to sheet", icon: "ChartBar" },
      { id: "integration.airtable", name: "Airtable", description: "Create Airtable record", icon: "ClipboardList" },
      { id: "integration.paddle", name: "Paddle", description: "Paddle billing operations", icon: "CreditCard" },
    ],
  },
  {
    id: "ai",
    name: "AI",
    icon: Bot,
    color: "text-pink-500",
    actions: [
      { id: "ai.generate_text", name: "Generate Text", description: "Generate with AI", icon: "Sparkles" },
      { id: "ai.summarize", name: "Summarize", description: "Summarize content", icon: "FileText" },
      { id: "ai.classify", name: "Classify", description: "Classify into categories", icon: "Tag" },
      { id: "ai.extract", name: "Extract Data", description: "Extract structured data", icon: "Search" },
      { id: "ai.sentiment", name: "Analyze Sentiment", description: "Analyze text sentiment", icon: "Smile" },
    ],
  },
]

// Flatten all actions for search
const ALL_ACTIONS = ACTION_CATEGORIES.flatMap((category) =>
  category.actions.map((action) => ({
    ...action,
    category: category.name,
  }))
)

// ============================================================================
// COMPONENT
// ============================================================================

export function ActionSearchPalette({
  open,
  onOpenChange,
  onSelectAction,
  recentActions = [],
  favoriteActions: _favoriteActions = [],
}: ActionSearchPaletteProps) {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Handle open change with reset logic
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (isOpen) {
      // Reset state when opening
      setSearch("")
      setSelectedCategory(null)
    }
    onOpenChange(isOpen)
  }, [onOpenChange])

  // Filter actions based on search and category
  const filteredActions = useMemo(() => {
    let results = ALL_ACTIONS

    // Filter by category if selected
    if (selectedCategory) {
      results = results.filter(
        (action) => action.category.toLowerCase() === selectedCategory.toLowerCase()
      )
    }

    // Filter by search query
    if (search) {
      const query = search.toLowerCase()
      results = results.filter(
        (action) =>
          action.name.toLowerCase().includes(query) ||
          action.description.toLowerCase().includes(query) ||
          action.category.toLowerCase().includes(query)
      )
    }

    return results
  }, [search, selectedCategory])

  // Get recent actions
  const recentActionItems = useMemo(() => {
    return recentActions
      .map((id) => ALL_ACTIONS.find((a) => a.id === id))
      .filter(Boolean) as ActionItem[]
  }, [recentActions])

  // Handle action selection
  const handleSelect = useCallback(
    (action: ActionItem) => {
      onSelectAction(action)
      handleOpenChange(false)
    },
    [onSelectAction, handleOpenChange]
  )

  // Keyboard shortcut to open
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleOpenChange(!open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, handleOpenChange])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-[640px]">
        <Command className="rounded-lg border-0" shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <CommandInput
              placeholder="Search actions..."
              value={search}
              onValueChange={setSearch}
              className="border-0 focus:ring-0"
            />
            <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              <span className="text-xs">ESC</span>
            </kbd>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1 p-2 border-b overflow-x-auto">
            <Button
              variant={selectedCategory === null ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs shrink-0"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {ACTION_CATEGORIES.map((category) => {
              const Icon = category.icon
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.name ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-7 text-xs shrink-0",
                    selectedCategory === category.name && category.color
                  )}
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === category.name ? null : category.name
                    )
                  }
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {category.name}
                </Button>
              )
            })}
          </div>

          <CommandList className="max-h-[400px]">
            <CommandEmpty>
              <div className="py-6 text-center">
                <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No actions found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try a different search term
                </p>
              </div>
            </CommandEmpty>

            {/* Recent Actions */}
            {!search && !selectedCategory && recentActionItems.length > 0 && (
              <>
                <CommandGroup heading="Recent">
                  {recentActionItems.slice(0, 3).map((action) => (
                    <CommandItem
                      key={action.id}
                      value={action.id}
                      onSelect={() => handleSelect(action)}
                      className="cursor-pointer"
                    >
                      <History className="h-4 w-4 mr-2 text-muted-foreground" />
                      {(() => { const I = icons[action.icon as keyof typeof icons]; return I ? <I className="h-4 w-4 mr-2" /> : null })()}
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{action.name}</span>
                        <span className="text-muted-foreground ml-2 text-sm">
                          {action.description}
                        </span>
                      </div>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {action.category}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Grouped by Category or Flat Results */}
            {selectedCategory || search ? (
              <CommandGroup heading={selectedCategory || "Results"}>
                {filteredActions.map((action) => (
                  <CommandItem
                    key={action.id}
                    value={action.id}
                    onSelect={() => handleSelect(action)}
                    className="cursor-pointer"
                  >
                    {(() => { const I = icons[action.icon as keyof typeof icons]; return I ? <I className="h-4 w-4 mr-2" /> : null })()}
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{action.name}</span>
                      <span className="text-muted-foreground ml-2 text-sm">
                        {action.description}
                      </span>
                    </div>
                    {!selectedCategory && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {action.category}
                      </Badge>
                    )}
                    <ChevronRight className="h-4 w-4 ml-2 text-muted-foreground" />
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              // Show all categories when no search/filter
              ACTION_CATEGORIES.map((category) => (
                <CommandGroup key={category.id} heading={category.name}>
                  {category.actions.map((action) => (
                    <CommandItem
                      key={action.id}
                      value={action.id}
                      onSelect={() =>
                        handleSelect({ ...action, category: category.name })
                      }
                      className="cursor-pointer"
                    >
                      {(() => { const I = icons[action.icon as keyof typeof icons]; return I ? <I className="h-4 w-4 mr-2" /> : null })()}
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{action.name}</span>
                        <span className="text-muted-foreground ml-2 text-sm truncate">
                          {action.description}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 ml-2 text-muted-foreground" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            )}
          </CommandList>

          {/* Footer */}
          <div className="flex items-center justify-between border-t p-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px]">
                ↑↓
              </kbd>
              <span>Navigate</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px]">
                ↵
              </kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Open with</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px]">
                ⌘K
              </kbd>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
