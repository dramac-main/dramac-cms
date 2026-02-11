/**
 * Live Chat Module Layout
 *
 * PHASE LC-03: Agent Dashboard
 * Auth guard, module access check, and horizontal sub-navigation
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
  MessagesSquare,
  MessageCircle,
  Users,
  Zap,
  BookOpen,
  BarChart3,
  Settings,
  Plus,
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
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Skeleton key={i} className="h-10 w-24" />
      ))}
    </div>
  )
}

async function LiveChatNav({ siteId }: { siteId: string }) {
  const headersList = await headers()
  const pathname =
    headersList.get('x-pathname') || headersList.get('x-invoke-path') || ''

  const navItems = [
    {
      href: `/dashboard/sites/${siteId}/live-chat`,
      label: 'Overview',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: `/dashboard/sites/${siteId}/live-chat/conversations`,
      label: 'Conversations',
      icon: MessagesSquare,
    },
    {
      href: `/dashboard/sites/${siteId}/live-chat/whatsapp`,
      label: 'WhatsApp',
      icon: MessageCircle,
    },
    {
      href: `/dashboard/sites/${siteId}/live-chat/agents`,
      label: 'Agents',
      icon: Users,
    },
    {
      href: `/dashboard/sites/${siteId}/live-chat/canned-responses`,
      label: 'Canned Responses',
      icon: Zap,
    },
    {
      href: `/dashboard/sites/${siteId}/live-chat/knowledge-base`,
      label: 'Knowledge Base',
      icon: BookOpen,
    },
    {
      href: `/dashboard/sites/${siteId}/live-chat/analytics`,
      label: 'Analytics',
      icon: BarChart3,
    },
    {
      href: `/dashboard/sites/${siteId}/live-chat/settings`,
      label: 'Settings',
      icon: Settings,
    },
  ]

  return (
    <nav className="flex items-center gap-1">
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href || pathname.endsWith('/live-chat')
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

export default async function LiveChatLayout({
  children,
  params,
}: LayoutProps) {
  const { siteId } = await params

  // Auth check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Module access check
  const hasAccess = await isModuleEnabledForSite(siteId, 'live-chat')
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
              <h1 className="text-lg font-semibold">Live Chat</h1>
            </div>

            {/* Right side: Quick action */}
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/sites/${siteId}/live-chat/conversations`}
              >
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  View Conversations
                </Button>
              </Link>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="flex items-center -mb-px overflow-x-auto scrollbar-thin scrollbar-thumb-muted">
            <Suspense fallback={<NavSkeleton />}>
              <LiveChatNav siteId={siteId} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}
