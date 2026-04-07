/**
 * CanvasSidebar — Draggable action palette for the canvas.
 *
 * Users drag items from this sidebar onto the canvas to create new nodes.
 * Uses native HTML drag/drop (onDragStart) which ReactFlow's onDrop handles.
 */

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mail,
  Bell,
  User,
  Globe,
  Clock,
  GitBranch,
  Repeat,
  StopCircle,
  Bot,
  MessageSquare,
  Database,
  Search,
  Zap,
  StickyNote,
} from "lucide-react";

// ============================================================================
// ACTION CATALOG
// ============================================================================

interface PaletteItem {
  id: string;
  name: string;
  actionType: string;
  stepType: string;
  icon: React.ElementType;
  category: string;
  description: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  // Communication
  {
    id: "email-send",
    name: "Send Email",
    actionType: "email.send",
    stepType: "action",
    icon: Mail,
    category: "Communication",
    description: "Send an email using templates",
  },
  {
    id: "email-branded",
    name: "Send Branded Email",
    actionType: "email.send_branded_template",
    stepType: "action",
    icon: Mail,
    category: "Communication",
    description: "Send branded agency email",
  },
  {
    id: "chat-message",
    name: "Send Chat Message",
    actionType: "chat.send_system_message",
    stepType: "action",
    icon: MessageSquare,
    category: "Communication",
    description: "Send live chat system message",
  },
  {
    id: "notification-push",
    name: "Push Notification",
    actionType: "notification.send_push",
    stepType: "action",
    icon: Bell,
    category: "Communication",
    description: "In-app push notification",
  },
  {
    id: "notification-in-app",
    name: "In-App Notification",
    actionType: "notification.in_app_targeted",
    stepType: "action",
    icon: Bell,
    category: "Communication",
    description: "Targeted in-app notification",
  },
  // CRM
  {
    id: "crm-update",
    name: "Update Contact",
    actionType: "crm.update_contact",
    stepType: "action",
    icon: User,
    category: "CRM",
    description: "Update CRM contact record",
  },
  {
    id: "crm-tag",
    name: "Add Tag",
    actionType: "crm.add_tag",
    stepType: "action",
    icon: User,
    category: "CRM",
    description: "Add tag to contact",
  },
  // Data
  {
    id: "webhook-call",
    name: "HTTP Request",
    actionType: "webhook.send",
    stepType: "action",
    icon: Globe,
    category: "Data",
    description: "Send an HTTP request",
  },
  {
    id: "data-transform",
    name: "Transform Data",
    actionType: "data.transform",
    stepType: "action",
    icon: Database,
    category: "Data",
    description: "Map and transform data",
  },
  // AI
  {
    id: "ai-generate",
    name: "AI Generate",
    actionType: "ai.generate_text",
    stepType: "action",
    icon: Bot,
    category: "AI",
    description: "Generate text with AI",
  },
  // Flow Control
  {
    id: "flow-condition",
    name: "Condition",
    actionType: "flow.condition",
    stepType: "condition",
    icon: GitBranch,
    category: "Flow",
    description: "Branch based on conditions",
  },
  {
    id: "flow-delay",
    name: "Delay",
    actionType: "flow.delay",
    stepType: "delay",
    icon: Clock,
    category: "Flow",
    description: "Wait before next step",
  },
  {
    id: "flow-loop",
    name: "Loop",
    actionType: "flow.loop",
    stepType: "loop",
    icon: Repeat,
    category: "Flow",
    description: "Iterate over items",
  },
  {
    id: "flow-stop",
    name: "Stop",
    actionType: "flow.stop",
    stepType: "stop",
    icon: StopCircle,
    category: "Flow",
    description: "End workflow execution",
  },
  // Utility
  {
    id: "note",
    name: "Sticky Note",
    actionType: "__note__",
    stepType: "note",
    icon: StickyNote,
    category: "Utility",
    description: "Add a documentation note",
  },
];

// Group items by category
const CATEGORIES = Array.from(new Set(PALETTE_ITEMS.map((i) => i.category)));

export function CanvasSidebar() {
  const [search, setSearch] = useState("");

  const filtered = search
    ? PALETTE_ITEMS.filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.description.toLowerCase().includes(search.toLowerCase()),
      )
    : PALETTE_ITEMS;

  const onDragStart = (e: React.DragEvent, item: PaletteItem) => {
    e.dataTransfer.setData("application/reactflow-type", item.stepType);
    e.dataTransfer.setData("application/reactflow-action", item.actionType);
    e.dataTransfer.setData("application/reactflow-name", item.name);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="flex h-full w-56 flex-col border-r bg-background">
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search actions..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {CATEGORIES.map((category) => {
            const items = filtered.filter((i) => i.category === category);
            if (items.length === 0) return null;

            return (
              <div key={category} className="mb-3">
                <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {category}
                </div>
                <div className="space-y-0.5">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, item)}
                      className="flex cursor-grab items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent active:cursor-grabbing"
                    >
                      <item.icon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                      <span className="truncate text-xs">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="px-2 py-8 text-center text-xs text-muted-foreground">
              No actions found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
