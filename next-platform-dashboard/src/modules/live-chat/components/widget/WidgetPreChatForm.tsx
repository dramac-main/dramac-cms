'use client'

/**
 * WidgetPreChatForm — Pre-chat form for collecting visitor info
 *
 * PHASE LC-04: Dynamic fields based on widget settings
 */

import { useState, type FormEvent } from 'react'
import type { WidgetPublicSettings, WidgetDepartment } from './ChatWidget'

interface WidgetPreChatFormProps {
  settings: WidgetPublicSettings
  departments: WidgetDepartment[]
  onSubmit: (data: {
    name?: string
    email?: string
    phone?: string
    departmentId?: string
    message?: string
  }) => void
  onClose: () => void
}

export function WidgetPreChatForm({
  settings,
  departments,
  onSubmit,
  onClose,
}: WidgetPreChatFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (settings.preChatNameRequired && !name.trim()) {
      newErrors.name = 'Name is required'
    }
    if (settings.preChatEmailRequired && !email.trim()) {
      newErrors.email = 'Email is required'
    } else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address'
    }
    if (settings.preChatPhoneRequired && !phone.trim()) {
      newErrors.phone = 'Phone is required'
    }
    if (settings.preChatMessageRequired && !message.trim()) {
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
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      departmentId: departmentId || undefined,
      message: message.trim() || undefined,
    })
    setIsSubmitting(false)
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
        className="px-4 py-4 flex items-center justify-between shrink-0"
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
          <div>
            <h3
              className="text-sm font-semibold"
              style={{ color: settings.textColor }}
            >
              {settings.companyName || 'Chat'}
            </h3>
          </div>
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

      {/* Welcome message */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-sm text-gray-600">{settings.welcomeMessage}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {/* Name */}
        {(settings.preChatNameRequired || true) && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Name {settings.preChatNameRequired && <span className="text-red-500">*</span>}
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
        )}

        {/* Email */}
        {(settings.preChatEmailRequired || true) && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email {settings.preChatEmailRequired && <span className="text-red-500">*</span>}
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
        )}

        {/* Phone */}
        {settings.preChatPhoneEnabled && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Phone {settings.preChatPhoneRequired && <span className="text-red-500">*</span>}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+260 97X XXX XXX"
              style={inputStyle}
            />
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
            )}
          </div>
        )}

        {/* Department selector */}
        {settings.preChatDepartmentSelector && departments.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              style={{
                ...inputStyle,
                appearance: 'auto',
              }}
            >
              <option value="">Select a department...</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Message */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Message {settings.preChatMessageRequired && <span className="text-red-500">*</span>}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="How can we help you?"
            rows={3}
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
          {isSubmitting ? 'Starting...' : 'Start Chat'}
        </button>
      </form>

      {/* Powered by */}
      <div className="px-4 py-2 text-center border-t shrink-0">
        <span className="text-[10px] text-gray-400">
          Powered by DRAMAC
        </span>
      </div>
    </div>
  )
}
