/**
 * Automation Module Layout
 * 
 * Phase EM-57B: Automation Engine - Visual Builder & Advanced Features
 * 
 * Layout for the automation module with navigation
 */

import { ReactNode } from "react"

export default function AutomationLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="flex flex-col h-full">
      {children}
    </div>
  )
}
