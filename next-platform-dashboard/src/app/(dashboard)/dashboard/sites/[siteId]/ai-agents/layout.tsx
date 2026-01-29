/**
 * AI Agents Layout
 * 
 * Phase EM-58C: AI Agents - Real-World Integration
 */

import { ReactNode } from "react"

interface AIAgentsLayoutProps {
  children: ReactNode
}

export default function AIAgentsLayout({ children }: AIAgentsLayoutProps) {
  return (
    <div className="flex flex-col h-full">
      {children}
    </div>
  )
}
