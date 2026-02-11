'use client'

/**
 * WidgetLauncher — Floating action button for chat widget
 *
 * PHASE LC-04: Positioned at configured corner, shows unread badge
 */

import type { WidgetPublicSettings } from './ChatWidget'

interface WidgetLauncherProps {
  settings: WidgetPublicSettings
  unreadCount: number
  onClick: () => void
}

export function WidgetLauncher({
  settings,
  unreadCount,
  onClick,
}: WidgetLauncherProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed flex items-center justify-center rounded-full shadow-lg hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={{
        backgroundColor: settings.primaryColor,
        width: `${settings.launcherSize}px`,
        height: `${settings.launcherSize}px`,
        bottom: '20px',
        ...(settings.position === 'bottom-right'
          ? { right: '20px' }
          : { left: '20px' }),
        zIndex: settings.zIndex,
      }}
      aria-label="Open chat"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={settings.textColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
      </svg>

      {unreadCount > 0 && (
        <span
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[11px] font-semibold flex items-center justify-center px-1"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}
