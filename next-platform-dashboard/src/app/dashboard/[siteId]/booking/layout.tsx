/**
 * Booking Module Layout
 * 
 * Phase EM-51: Booking Module
 */

import { ReactNode } from 'react'

interface BookingLayoutProps {
  children: ReactNode
}

export default function BookingLayout({ children }: BookingLayoutProps) {
  return (
    <div className="flex flex-col h-full">
      {children}
    </div>
  )
}
