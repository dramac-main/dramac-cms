/**
 * Puck Advanced Layout Components (PHASE-ED-02A)
 * 
 * Advanced layout components for complex page structures.
 * Includes Grid, Flexbox, Tabs, Accordion, Modal, Drawer, etc.
 */

import React, { useState } from "react";
import { DropZone } from "@puckeditor/core";
import type {
  GridProps,
  FlexboxProps,
  TabsContainerProps,
  AccordionContainerProps,
  ModalTriggerProps,
  DrawerTriggerProps,
  AspectRatioProps,
  StackProps,
  StickyContainerProps,
  ScrollAreaProps,
} from "@/types/puck";
import { cn } from "@/lib/utils";
import { ChevronDown, X, Menu } from "lucide-react";

// Gap utilities
const gapMap: Record<string, string> = {
  none: "gap-0",
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-8",
  xl: "gap-12",
};

// Padding utilities
const paddingMap: Record<string, string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

// Justify content utilities
const justifyMap: Record<string, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

// Align items utilities
const alignMap: Record<string, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

/**
 * Grid Component
 * CSS Grid layout with configurable columns and rows.
 */
export function GridRender({
  columns = 3,
  rows,
  gap = "md",
  rowGap,
  columnGap,
  alignItems = "stretch",
  justifyItems = "stretch",
  minChildWidth,
  autoFit = false,
  padding = "none",
  backgroundColor,
}: GridProps) {
  const gridCols = autoFit && minChildWidth
    ? `repeat(auto-fit, minmax(${minChildWidth}px, 1fr))`
    : `repeat(${columns}, 1fr)`;

  const gridRows = rows ? `repeat(${rows}, 1fr)` : undefined;

  return (
    <div
      className={cn(
        "grid w-full",
        paddingMap[padding || "none"],
        !columnGap && !rowGap && gapMap[gap || "md"],
        columnGap && `gap-x-${columnGap === "none" ? 0 : columnGap === "sm" ? 2 : columnGap === "md" ? 4 : columnGap === "lg" ? 8 : 12}`,
        rowGap && `gap-y-${rowGap === "none" ? 0 : rowGap === "sm" ? 2 : rowGap === "md" ? 4 : rowGap === "lg" ? 8 : 12}`
      )}
      style={{
        gridTemplateColumns: gridCols,
        gridTemplateRows: gridRows,
        alignItems: alignItems || "stretch",
        justifyItems: justifyItems || "stretch",
        backgroundColor: backgroundColor || undefined,
      }}
    >
      {Array.from({ length: (columns || 3) * (rows || 1) }).map((_, index) => (
        <div key={index} className="min-h-[50px]">
          <DropZone zone={`grid-cell-${index}`} />
        </div>
      ))}
    </div>
  );
}

/**
 * Flexbox Component
 * Flexible box layout with full control over alignment and spacing.
 */
export function FlexboxRender({
  direction = "row",
  wrap = "wrap",
  justifyContent = "start",
  alignItems = "start",
  gap = "md",
  padding = "none",
  backgroundColor,
}: FlexboxProps) {
  const directionMap: Record<string, string> = {
    row: "flex-row",
    "row-reverse": "flex-row-reverse",
    column: "flex-col",
    "column-reverse": "flex-col-reverse",
  };

  const wrapMap: Record<string, string> = {
    nowrap: "flex-nowrap",
    wrap: "flex-wrap",
    "wrap-reverse": "flex-wrap-reverse",
  };

  return (
    <div
      className={cn(
        "flex w-full",
        directionMap[direction || "row"],
        wrapMap[wrap || "wrap"],
        justifyMap[justifyContent || "start"],
        alignMap[alignItems || "start"],
        gapMap[gap || "md"],
        paddingMap[padding || "none"]
      )}
      style={{ backgroundColor: backgroundColor || undefined }}
    >
      <DropZone zone="flexbox-content" />
    </div>
  );
}

/**
 * Tabs Container Component
 * Tabbed content panels with multiple style variants.
 */
export function TabsContainerRender({
  tabs = [
    { id: "tab1", label: "Tab 1" },
    { id: "tab2", label: "Tab 2" },
    { id: "tab3", label: "Tab 3" },
  ],
  defaultTab,
  variant = "default",
  alignment = "left",
  orientation = "horizontal",
}: TabsContainerProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs?.[0]?.id || "tab1");

  const alignmentClasses: Record<string, string> = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    full: "justify-stretch",
  };

  const variantClasses: Record<string, string> = {
    default: "border-b border-border",
    pills: "bg-muted rounded-lg p-1",
    underline: "",
  };

  const tabClasses: Record<string, string> = {
    default: "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
    pills: "px-4 py-2 text-sm font-medium rounded-md transition-colors",
    underline: "px-4 py-2 text-sm font-medium transition-colors border-b-2",
  };

  const activeClasses: Record<string, string> = {
    default: "border-primary text-primary",
    pills: "bg-background text-foreground shadow-sm",
    underline: "border-primary text-primary",
  };

  const inactiveClasses: Record<string, string> = {
    default: "border-transparent text-muted-foreground hover:text-foreground",
    pills: "text-muted-foreground hover:text-foreground",
    underline: "border-transparent text-muted-foreground hover:text-foreground",
  };

  const isVertical = orientation === "vertical";

  return (
    <div className={cn("w-full", isVertical && "flex gap-4")}>
      {/* Tab List */}
      <div
        className={cn(
          "flex",
          isVertical ? "flex-col min-w-[150px]" : alignmentClasses[alignment || "left"],
          !isVertical && variantClasses[variant || "default"]
        )}
        role="tablist"
      >
        {(tabs || []).map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              tabClasses[variant || "default"],
              activeTab === tab.id
                ? activeClasses[variant || "default"]
                : inactiveClasses[variant || "default"],
              alignment === "full" && !isVertical && "flex-1 text-center"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className={cn("mt-4", isVertical && "flex-1 mt-0")}>
        {(tabs || []).map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            hidden={activeTab !== tab.id}
            className={cn(
              "min-h-[100px]",
              activeTab !== tab.id && "hidden"
            )}
          >
            <DropZone zone={`tab-${tab.id}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Accordion Container Component
 * Collapsible content panels.
 */
export function AccordionContainerRender({
  items = [
    { id: "item1", title: "Section 1" },
    { id: "item2", title: "Section 2" },
    { id: "item3", title: "Section 3" },
  ],
  multiple = false,
  allowMultiple = false,
  defaultOpen,
  variant = "default",
  iconPosition = "right",
}: AccordionContainerProps) {
  // Handle defaultOpen which can be a number or string array
  const getInitialOpen = (): string[] => {
    if (Array.isArray(defaultOpen)) {
      return defaultOpen;
    }
    if (typeof defaultOpen === "number" && items && items[defaultOpen]) {
      return [items[defaultOpen].id];
    }
    return [];
  };

  const [openItems, setOpenItems] = useState<string[]>(getInitialOpen);
  const canOpenMultiple = multiple || allowMultiple;

  const toggleItem = (id: string) => {
    if (canOpenMultiple) {
      setOpenItems((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      setOpenItems((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  const variantClasses: Record<string, string> = {
    default: "border-b border-border",
    bordered: "border border-border rounded-lg mb-2",
    separated: "bg-muted/50 rounded-lg mb-2",
  };

  return (
    <div className="w-full">
      {(items || []).map((item) => {
        const isOpen = openItems.includes(item.id);
        return (
          <div key={item.id} className={variantClasses[variant || "default"]}>
            <button
              onClick={() => toggleItem(item.id)}
              className={cn(
                "flex w-full items-center justify-between py-4 px-4 text-left font-medium transition-colors hover:bg-muted/50",
                iconPosition === "left" && "flex-row-reverse"
              )}
              aria-expanded={isOpen}
            >
              <span>{item.title}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div className="px-4 pb-4">
                <DropZone zone={`accordion-${item.id}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Modal Trigger Component
 * Opens a modal dialog with custom content.
 */
export function ModalTriggerRender({
  triggerText = "Open Modal",
  triggerVariant = "primary",
  modalTitle = "Modal Title",
  modalSize = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
}: ModalTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const variantClasses: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
    outline: "border border-input bg-background hover:bg-accent",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };

  const sizeClasses: Record<string, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-[90vw]",
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "px-4 py-2 rounded-md font-medium transition-colors",
          variantClasses[triggerVariant || "primary"]
        )}
      >
        {triggerText}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={closeOnOverlayClick ? () => setIsOpen(false) : undefined}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Modal */}
          <div
            className={cn(
              "relative z-10 w-full bg-background rounded-lg shadow-xl",
              sizeClasses[modalSize || "md"]
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{modalTitle}</h2>
              {showCloseButton && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-md hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-4 min-h-[100px]">
              <DropZone zone="modal-content" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Drawer Trigger Component
 * Opens a slide-out panel.
 */
export function DrawerTriggerRender({
  triggerText = "Open Menu",
  triggerVariant = "outline",
  drawerTitle = "Menu",
  position = "left",
  size = "md",
  overlay = true,
}: DrawerTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const variantClasses: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
    outline: "border border-input bg-background hover:bg-accent",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };

  const sizeMap: Record<string, string> = {
    sm: "w-64",
    md: "w-80",
    lg: "w-96",
  };

  const positionClasses: Record<string, string> = {
    left: "left-0 top-0 h-full",
    right: "right-0 top-0 h-full",
    top: "top-0 left-0 w-full h-auto",
    bottom: "bottom-0 left-0 w-full h-auto",
  };

  const translateClasses: Record<string, { open: string; closed: string }> = {
    left: { open: "translate-x-0", closed: "-translate-x-full" },
    right: { open: "translate-x-0", closed: "translate-x-full" },
    top: { open: "translate-y-0", closed: "-translate-y-full" },
    bottom: { open: "translate-y-0", closed: "translate-y-full" },
  };

  const isHorizontal = position === "left" || position === "right";

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "px-4 py-2 rounded-md font-medium transition-colors inline-flex items-center gap-2",
          variantClasses[triggerVariant || "outline"]
        )}
      >
        <Menu className="h-4 w-4" />
        {triggerText}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          {overlay && (
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsOpen(false)}
            />
          )}

          {/* Drawer */}
          <div
            className={cn(
              "fixed bg-background shadow-xl transition-transform duration-300",
              positionClasses[position || "left"],
              isHorizontal && sizeMap[size || "md"],
              isOpen
                ? translateClasses[position || "left"].open
                : translateClasses[position || "left"].closed
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{drawerTitle}</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 min-h-[100px]">
              <DropZone zone="drawer-content" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Aspect Ratio Component
 * Maintains aspect ratio for content.
 */
export function AspectRatioRender({
  ratio = "16:9",
  customRatio,
  backgroundColor,
}: AspectRatioProps) {
  const ratioMap: Record<string, number> = {
    "1:1": 1,
    "4:3": 4 / 3,
    "16:9": 16 / 9,
    "21:9": 21 / 9,
    "3:4": 3 / 4,
    "9:16": 9 / 16,
  };

  const aspectValue = customRatio || ratioMap[ratio || "16:9"] || 16 / 9;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        paddingBottom: `${(1 / aspectValue) * 100}%`,
        backgroundColor: backgroundColor || undefined,
      }}
    >
      <div className="absolute inset-0">
        <DropZone zone="aspect-content" />
      </div>
    </div>
  );
}

/**
 * Stack Component
 * Vertical or horizontal stack layout with optional dividers.
 */
export function StackRender({
  direction = "vertical",
  gap = "md",
  align = "stretch",
  justify = "start",
  wrap = false,
  dividers = false,
  padding = "none",
}: StackProps) {
  return (
    <div
      className={cn(
        "flex",
        direction === "vertical" ? "flex-col" : "flex-row",
        gapMap[gap || "md"],
        alignMap[align || "stretch"],
        justifyMap[justify || "start"],
        wrap && "flex-wrap",
        paddingMap[padding || "none"],
        dividers && direction === "vertical" && "divide-y divide-border",
        dividers && direction === "horizontal" && "divide-x divide-border"
      )}
    >
      <DropZone zone="stack-content" />
    </div>
  );
}

/**
 * Sticky Container Component
 * Content that sticks to viewport edge.
 */
export function StickyContainerRender({
  top = 0,
  bottom,
  zIndex = 40,
  backgroundColor,
  shadow = true,
}: StickyContainerProps) {
  return (
    <div
      className={cn(
        "sticky w-full",
        shadow && "shadow-md"
      )}
      style={{
        top: bottom === undefined ? `${top}px` : undefined,
        bottom: bottom !== undefined ? `${bottom}px` : undefined,
        zIndex,
        backgroundColor: backgroundColor || "var(--background)",
      }}
    >
      <DropZone zone="sticky-content" />
    </div>
  );
}

/**
 * Scroll Area Component
 * Scrollable content container.
 */
export function ScrollAreaRender({
  maxHeight = 400,
  showScrollbar = "auto",
  orientation = "vertical",
  padding = "md",
}: ScrollAreaProps) {
  const scrollbarClasses: Record<string, string> = {
    auto: "scrollbar-auto",
    always: "scrollbar-thin",
    hover: "scrollbar-thin scrollbar-thumb-transparent hover:scrollbar-thumb-border",
    never: "scrollbar-none",
  };

  const overflowClasses: Record<string, string> = {
    vertical: "overflow-y-auto overflow-x-hidden",
    horizontal: "overflow-x-auto overflow-y-hidden",
    both: "overflow-auto",
  };

  return (
    <div
      className={cn(
        "w-full",
        overflowClasses[orientation || "vertical"],
        scrollbarClasses[showScrollbar || "auto"],
        paddingMap[padding || "md"]
      )}
      style={{ maxHeight: `${maxHeight}px` }}
    >
      <DropZone zone="scroll-content" />
    </div>
  );
}
