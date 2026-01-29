/**
 * CRM Module Layout
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 */

import { ReactNode } from 'react'

interface CRMLayoutProps {
  children: ReactNode
}

export default function CRMLayout({ children }: CRMLayoutProps) {
  return (
    <div className="flex flex-col h-full">
      {children}
    </div>
  )
}
