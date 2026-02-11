/**
 * Social Media Module Layout
 * 
 * Phase EM-54: Social Media Management Module
 * Provides consistent navigation across all social media pages
 */

import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isModuleEnabledForSite } from '@/lib/actions/sites'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ArrowLeft, 
  LayoutDashboard, 
  Calendar, 
  Send, 
  Inbox, 
  Users,
  Plus,
  BarChart3,
  Megaphone,
  CircleCheck,
  Settings
} from 'lucide-react'
import { headers } from 'next/headers'
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ siteId: string }>
}

function NavSkeleton() {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(i => (
        <Skeleton key={i} className="h-10 w-24" />
      ))}
    </div>
  )
}

async function SocialNav({ siteId }: { siteId: string }) {
  // Get current path to highlight active tab
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || ''
  
  const navItems = [
    { href: `/dashboard/sites/${siteId}/social`, label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: `/dashboard/sites/${siteId}/social/calendar`, label: 'Calendar', icon: Calendar },
    { href: `/dashboard/sites/${siteId}/social/compose`, label: 'Compose', icon: Send },
    { href: `/dashboard/sites/${siteId}/social/inbox`, label: 'Inbox', icon: Inbox },
    { href: `/dashboard/sites/${siteId}/social/accounts`, label: 'Accounts', icon: Users },
    { href: `/dashboard/sites/${siteId}/social/analytics`, label: 'Analytics', icon: BarChart3 },
    { href: `/dashboard/sites/${siteId}/social/campaigns`, label: 'Campaigns', icon: Megaphone },
    { href: `/dashboard/sites/${siteId}/social/approvals`, label: 'Approvals', icon: CircleCheck },
    { href: `/dashboard/sites/${siteId}/social/settings`, label: 'Settings', icon: Settings },
  ]

  return (
    <nav className="flex items-center gap-1">
      {navItems.map((item) => {
        // Determine if this nav item is active
        const isActive = item.exact 
          ? pathname === item.href || pathname.endsWith('/social')
          : pathname.startsWith(item.href)
        
        return (
          <Link key={item.href} href={item.href}>
            <Button 
              variant={isActive ? 'secondary' : 'ghost'} 
              size="sm" 
              className={cn('gap-2', isActive && 'bg-secondary')}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        )
      })}
    </nav>
  )
}

export default async function SocialMediaLayout({ children, params }: LayoutProps) {
  const { siteId } = await params
  
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Module access check
  const hasAccess = await isModuleEnabledForSite(siteId, 'social-media')
  if (!hasAccess) {
    redirect(`/dashboard/sites/${siteId}?tab=modules`)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container">
          <div className="flex items-center justify-between h-14">
            {/* Left side: Back + Title */}
            <div className="flex items-center gap-4">
              <Link href={`/dashboard/sites/${siteId}?tab=modules`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Site
                </Button>
              </Link>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-lg font-semibold">Social Media</h1>
            </div>
            
            {/* Right side: Quick actions */}
            <div className="flex items-center gap-2">
              <Link href={`/dashboard/sites/${siteId}/social/compose`}>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Navigation tabs */}
          <div className="flex items-center -mb-px">
            <Suspense fallback={<NavSkeleton />}>
              <SocialNav siteId={siteId} />
            </Suspense>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
