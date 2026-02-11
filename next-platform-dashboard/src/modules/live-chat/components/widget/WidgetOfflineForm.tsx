'use client'

/**
 * WidgetOfflineForm — Offline message form when outside business hours
 *
 * PHASE LC-04: Shows offline message, collects name/email/message
 */

import { useState, type FormEvent } from 'react'
import type { WidgetPublicSettings } from './ChatWidget'

interface WidgetOfflineFormProps {
  settings: WidgetPublicSettings
  onSubmit: (data: { name: string; email: string; message: string }) => void
  onClose: () => void
}

export function WidgetOfflineForm({
  settings,
  onSubmit,
  onClose,
}: WidgetOfflineFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Name is required'
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address'
    }
    if (!message.trim()) {
      newErrors.message = 'Message is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    await onSubmit({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    })
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s',
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between shrink-0"
        style={{ backgroundColor: settings.primaryColor }}
      >
        <div className="flex items-center gap-3">
          {settings.logoUrl && (
            <img
              src={settings.logoUrl}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
            />
          )}
          <h3
            className="text-sm font-semibold"
            style={{ color: settings.textColor }}
          >
            {settings.companyName || 'Contact Us'}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:opacity-80 transition-opacity"
          aria-label="Close"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={settings.textColor}
            strokeWidth="2"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {isSubmitted ? (
        /* Success state */
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: `${settings.primaryColor}15` }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke={settings.primaryColor}
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="M22 4 12 14.01l-3-3" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-gray-800 mb-1">
            Message Sent!
          </h4>
          <p className="text-sm text-gray-500 mb-6">
            We&apos;ll get back to you as soon as we&apos;re back online.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: settings.primaryColor,
              color: settings.textColor,
            }}
          >
            Close
          </button>
        </div>
      ) : (
        /* Offline form */
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Offline message */}
          <div className="flex items-start gap-3 mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d97706"
              strokeWidth="2"
              className="shrink-0 mt-0.5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800 mb-0.5">
                We&apos;re currently offline
              </p>
              <p className="text-xs text-amber-700">
                {settings.offlineMessage || 'Leave us a message and we\'ll get back to you as soon as possible.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                style={inputStyle}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={inputStyle}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help you?"
                rows={4}
                style={{
                  ...inputStyle,
                  resize: 'none',
                }}
              />
              {errors.message && (
                <p className="text-xs text-red-500 mt-1">{errors.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-60"
              style={{
                backgroundColor: settings.primaryColor,
                color: settings.textColor,
              }}
            >
              {isSubmitting ? 'Sending...' : 'Leave a Message'}
            </button>
          </form>
        </div>
      )}

      {/* Powered by */}
      <div className="px-4 py-2 text-center border-t shrink-0">
        <span className="text-[10px] text-gray-400">
          Powered by DRAMAC
        </span>
      </div>
    </div>
  )
}
