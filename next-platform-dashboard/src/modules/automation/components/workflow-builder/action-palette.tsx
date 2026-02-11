/**
 * ActionPalette Component
 * 
 * Phase EM-57B: Automation Engine - Visual Builder & Advanced Features
 * 
 * Draggable palette of available actions organized by category.
 * Users can drag actions from the palette onto the workflow canvas.
 */

"use client"

import { useDraggable } from "@dnd-kit/core"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { useState, useMemo } from "react"
import { Search, GripVertical, icons } from "lucide-react"

// ============================================================================
// ACTION CATEGORIES
// ============================================================================

const ACTION_CATEGORIES = [
  {
    name: "CRM",
    icon: "User",
    actions: [
      { id: "crm.create_contact", name: "Create Contact", icon: "UserPlus", description: "Add a new contact to CRM" },
      { id: "crm.update_contact", name: "Update Contact", icon: "Pencil", description: "Modify contact fields" },
      { id: "crm.add_tag", name: "Add Tag", icon: "Tag", description: "Add tag to contact" },
      { id: "crm.remove_tag", name: "Remove Tag", icon: "Tag", description: "Remove tag from contact" },
      { id: "crm.create_deal", name: "Create Deal", icon: "CircleDollarSign", description: "Create new deal/opportunity" },
      { id: "crm.move_deal_stage", name: "Move Deal Stage", icon: "ArrowRight", description: "Move deal to different stage" },
      { id: "crm.create_task", name: "Create Task", icon: "CircleCheck", description: "Create a follow-up task" },
      { id: "crm.log_activity", name: "Log Activity", icon: "FileText", description: "Log call, meeting, or note" },
      { id: "crm.find_contact", name: "Find Contact", icon: "Search", description: "Find contact by field" },
    ],
  },
  {
    name: "Communication",
    icon: "Mail",
    actions: [
      { id: "email.send", name: "Send Email", icon: "Mail", description: "Send a custom email" },
      { id: "email.send_template", name: "Send Template Email", icon: "MailOpen", description: "Send from template" },
      { id: "notification.send_sms", name: "Send SMS", icon: "Smartphone", description: "Send SMS message" },
      { id: "notification.send_slack", name: "Send to Slack", icon: "MessageSquare", description: "Post to Slack channel" },
      { id: "notification.send_discord", name: "Send to Discord", icon: "Gamepad2", description: "Post to Discord" },
      { id: "notification.in_app", name: "In-App Notification", icon: "Bell", description: "Send in-app alert" },
    ],
  },
  {
    name: "Data",
    icon: "Database",
    actions: [
      { id: "data.lookup", name: "Lookup Record", icon: "Search", description: "Find a database record" },
      { id: "data.create", name: "Create Record", icon: "Plus", description: "Insert new record" },
      { id: "data.update", name: "Update Record", icon: "Pencil", description: "Update existing record" },
      { id: "data.delete", name: "Delete Record", icon: "Trash2", description: "Remove a record" },
    ],
  },
  {
    name: "Flow Control",
    icon: "GitBranch",
    actions: [
      { id: "flow.delay", name: "Delay", icon: "Timer", description: "Wait before continuing" },
      { id: "flow.condition", name: "Condition (If/Else)", icon: "GitBranch", description: "Branch based on condition" },
      { id: "flow.loop", name: "Loop", icon: "Repeat", description: "Repeat for each item" },
      { id: "flow.stop", name: "Stop Workflow", icon: "StopCircle", description: "End workflow execution" },
    ],
  },
  {
    name: "Transform",
    icon: "RefreshCw",
    actions: [
      { id: "transform.map", name: "Map Data", icon: "RefreshCw", description: "Transform data shape" },
      { id: "transform.filter", name: "Filter Array", icon: "Search", description: "Filter items in array" },
      { id: "transform.aggregate", name: "Aggregate", icon: "ChartBar", description: "Sum, count, average" },
      { id: "transform.format_date", name: "Format Date", icon: "Calendar", description: "Format date/time" },
      { id: "transform.template", name: "Render Template", icon: "FileText", description: "Generate text from template" },
    ],
  },
  {
    name: "External",
    icon: "Globe",
    actions: [
      { id: "webhook.send", name: "HTTP Request", icon: "Globe", description: "Call external API" },
      { id: "integration.google_sheets", name: "Google Sheets", icon: "ChartBar", description: "Add row to sheet" },
      { id: "integration.airtable", name: "Airtable", icon: "ClipboardList", description: "Create Airtable record" },
      { id: "integration.paddle", name: "Paddle", icon: "CreditCard", description: "Paddle billing operations" },
    ],
  },
  {
    name: "AI",
    icon: "Bot",
    actions: [
      { id: "ai.generate_text", name: "Generate Text", icon: "Sparkles", description: "Generate with AI" },
      { id: "ai.summarize", name: "Summarize", icon: "FileText", description: "Summarize content" },
      { id: "ai.classify", name: "Classify", icon: "Tag", description: "Classify into categories" },
      { id: "ai.extract", name: "Extract Data", icon: "Search", description: "Extract structured data" },
      { id: "ai.sentiment", name: "Analyze Sentiment", icon: "Smile", description: "Analyze text sentiment" },
    ],
  },
]

// ============================================================================
// DRAGGABLE ACTION COMPONENT
// ============================================================================

interface DraggableActionProps {
  action: {
    id: string
    name: string
    icon: string
    description: string
  }
}

function DraggableAction({ action }: DraggableActionProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: action.id,
    data: {
      type: "palette-item",
      actionType: action.id,
      name: action.name,
      icon: action.icon,
    },
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        flex items-center gap-2 p-2 rounded-md cursor-grab
        hover:bg-accent transition-colors group
        ${isDragging ? "opacity-50 shadow-lg" : ""}
      `}
      title={action.description}
    >
      <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      {(() => { const I = icons[action.icon as keyof typeof icons]; return I ? <I className="h-4 w-4" /> : null })()}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium truncate">{action.name}</span>
      </div>
    </div>
  )
}

// ============================================================================
// ACTION PALETTE COMPONENT
// ============================================================================

export function ActionPalette() {
  const [search, setSearch] = useState("")

  const filteredCategories = useMemo(() => {
    if (!search) return ACTION_CATEGORIES

    const lowerSearch = search.toLowerCase()
    return ACTION_CATEGORIES.map((cat) => ({
      ...cat,
      actions: cat.actions.filter(
        (a) =>
          a.name.toLowerCase().includes(lowerSearch) ||
          a.description.toLowerCase().includes(lowerSearch) ||
          a.id.toLowerCase().includes(lowerSearch)
      ),
    })).filter((cat) => cat.actions.length > 0)
  }, [search])

  return (
    <div className="flex-1 flex flex-col border-t">
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          {(() => { const I = icons['Puzzle']; return I ? <I className="h-4 w-4" /> : null })()}
          Actions
        </h3>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search actions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <div key={category.name}>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                  {(() => { const I = icons[category.icon as keyof typeof icons]; return I ? <I className="h-3 w-3" /> : null })()}
                  <span>{category.name}</span>
                  <span className="ml-auto text-[10px] font-normal">
                    {category.actions.length}
                  </span>
                </h4>
                <div className="space-y-0.5">
                  {category.actions.map((action) => (
                    <DraggableAction key={action.id} action={action} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No actions found matching &quot;{search}&quot;
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t bg-muted/50">
        <p className="text-xs text-muted-foreground text-center">
          Drag actions onto the canvas to add steps
        </p>
      </div>
    </div>
  )
}
