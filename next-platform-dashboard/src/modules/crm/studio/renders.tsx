/**
 * CRM Module - Studio Component Renders
 * 
 * These are the actual React components rendered inside the Studio preview
 * and published website pages. They send form data to the CRM form-capture API.
 * 
 * Flow: Studio Preview → Published Site → /api/modules/crm/form-capture → CRM Contact
 */
'use client'

import React, { useState, FormEvent } from 'react'

// =============================================================================
// SHARED HELPERS
// =============================================================================

const borderRadiusMap: Record<string, string> = {
  none: '0',
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
}

const shadowMap: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
}

interface SubmitState {
  loading: boolean
  success: boolean
  error: string | null
}

async function submitToCRM(data: Record<string, string>, formType: string): Promise<void> {
  // Determine the API URL — works for both same-origin (dashboard) and cross-origin (published site)
  const apiUrl = typeof window !== 'undefined' && (window as any).__CRM_API_URL
    ? (window as any).__CRM_API_URL
    : '/api/modules/crm/form-capture'

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      form_type: formType,
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.error || 'Failed to submit form')
  }
}

// Shared input style
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  border: '1px solid #e2e8f0',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  outline: 'none',
  transition: 'border-color 0.15s',
  backgroundColor: '#fff',
  color: '#1e293b',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#374151',
  marginBottom: '0.25rem',
}

// =============================================================================
// CRM CONTACT FORM RENDER
// =============================================================================

interface CRMContactFormProps {
  title?: string
  subtitle?: string
  nameLabel?: string
  emailLabel?: string
  phoneLabel?: string
  messageLabel?: string
  submitText?: string
  successMessage?: string
  showPhone?: boolean
  showCompany?: boolean
  showSubject?: boolean
  backgroundColor?: string
  buttonColor?: string
  buttonTextColor?: string
  textColor?: string
  borderRadius?: string
  shadow?: string
  siteId?: string
}

export function CRMContactFormRender(props: CRMContactFormProps) {
  const {
    title = 'Contact Us',
    subtitle = "Fill out the form below and we'll get back to you shortly.",
    nameLabel = 'Full Name',
    emailLabel = 'Email Address',
    phoneLabel = 'Phone Number',
    messageLabel = 'Message',
    submitText = 'Send Message',
    successMessage = "Thank you! We'll be in touch soon.",
    showPhone = true,
    showCompany = false,
    showSubject = true,
    backgroundColor = '#ffffff',
    buttonColor = 'var(--brand-primary, #3b82f6)',
    buttonTextColor = 'var(--brand-button-text, #ffffff)',
    textColor = '#1e293b',
    borderRadius = 'xl',
    shadow = 'lg',
    siteId,
  } = props

  const [state, setState] = useState<SubmitState>({ loading: false, success: false, error: null })

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setState({ loading: true, success: false, error: null })

    const formData = new FormData(e.currentTarget)
    const data: Record<string, string> = {
      site_id: siteId || '',
      name: formData.get('name') as string || '',
      email: formData.get('email') as string || '',
      phone: formData.get('phone') as string || '',
      company: formData.get('company') as string || '',
      subject: formData.get('subject') as string || '',
      message: formData.get('message') as string || '',
    }

    try {
      await submitToCRM(data, 'contact')
      setState({ loading: false, success: true, error: null })
    } catch (err) {
      setState({ loading: false, success: false, error: (err as Error).message })
    }
  }

  if (state.success) {
    return (
      <div style={{
        backgroundColor,
        borderRadius: borderRadiusMap[borderRadius] || borderRadiusMap.xl,
        boxShadow: shadowMap[shadow] || shadowMap.lg,
        padding: '2.5rem',
        textAlign: 'center',
        color: textColor,
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
        <p style={{ fontSize: '1.125rem', fontWeight: 600 }}>{successMessage}</p>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor,
      borderRadius: borderRadiusMap[borderRadius] || borderRadiusMap.xl,
      boxShadow: shadowMap[shadow] || shadowMap.lg,
      padding: '2rem',
      color: textColor,
    }}>
      {/* Honeypot for spam */}
      <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {title && <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>{title}</h3>}
      {subtitle && <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>{subtitle}</p>}

      {state.error && (
        <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {state.error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>{nameLabel} *</label>
          <input name="name" required style={inputStyle} placeholder="John Smith" />
        </div>

        <div>
          <label style={labelStyle}>{emailLabel} *</label>
          <input name="email" type="email" required style={inputStyle} placeholder="john@example.com" />
        </div>

        {showPhone && (
          <div>
            <label style={labelStyle}>{phoneLabel}</label>
            <input name="phone" type="tel" style={inputStyle} placeholder="+1 (555) 000-0000" />
          </div>
        )}

        {showCompany && (
          <div>
            <label style={labelStyle}>Company</label>
            <input name="company" style={inputStyle} placeholder="Acme Inc." />
          </div>
        )}

        {showSubject && (
          <div>
            <label style={labelStyle}>Subject</label>
            <input name="subject" style={inputStyle} placeholder="How can we help?" />
          </div>
        )}

        <div>
          <label style={labelStyle}>{messageLabel} *</label>
          <textarea name="message" required rows={4} style={{ ...inputStyle, resize: 'vertical' as const }} placeholder="Tell us about your project..." />
        </div>

        <button
          type="submit"
          disabled={state.loading}
          style={{
            width: '100%',
            padding: '0.75rem 1.5rem',
            backgroundColor: state.loading ? '#94a3b8' : buttonColor,
            color: buttonTextColor,
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: state.loading ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.15s',
          }}
        >
          {state.loading ? 'Sending...' : submitText}
        </button>
      </form>
    </div>
  )
}

// =============================================================================
// CRM LEAD CAPTURE FORM RENDER
// =============================================================================

interface CRMLeadCaptureFormProps {
  title?: string
  subtitle?: string
  submitText?: string
  successMessage?: string
  showPhone?: boolean
  showCompany?: boolean
  layout?: 'horizontal' | 'vertical' | 'card'
  backgroundColor?: string
  buttonColor?: string
  buttonTextColor?: string
  siteId?: string
}

export function CRMLeadCaptureFormRender(props: CRMLeadCaptureFormProps) {
  const {
    title = 'Get Started',
    subtitle = 'Enter your details to get a free consultation.',
    submitText = 'Get Started',
    successMessage = "Thank you! We'll contact you shortly.",
    showPhone = true,
    showCompany = true,
    layout = 'horizontal',
    backgroundColor = '#f8fafc',
    buttonColor = 'var(--brand-primary, #3b82f6)',
    buttonTextColor = 'var(--brand-button-text, #ffffff)',
    siteId,
  } = props

  const [state, setState] = useState<SubmitState>({ loading: false, success: false, error: null })

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setState({ loading: true, success: false, error: null })

    const formData = new FormData(e.currentTarget)
    const data: Record<string, string> = {
      site_id: siteId || '',
      name: formData.get('name') as string || '',
      email: formData.get('email') as string || '',
      phone: formData.get('phone') as string || '',
      company: formData.get('company') as string || '',
    }

    try {
      await submitToCRM(data, 'lead_capture')
      setState({ loading: false, success: true, error: null })
    } catch (err) {
      setState({ loading: false, success: false, error: (err as Error).message })
    }
  }

  if (state.success) {
    return (
      <div style={{ backgroundColor, padding: '2rem', borderRadius: '0.75rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
        <p style={{ fontSize: '1rem', fontWeight: 600 }}>{successMessage}</p>
      </div>
    )
  }

  const isHorizontal = layout === 'horizontal'
  const isCard = layout === 'card'

  return (
    <div style={{
      backgroundColor,
      padding: isCard ? '2rem' : '1.5rem',
      borderRadius: '0.75rem',
      ...(isCard ? { boxShadow: shadowMap.lg, border: '1px solid #e2e8f0' } : {}),
    }}>
      {title && <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>{title}</h3>}
      {subtitle && <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>{subtitle}</p>}

      {state.error && (
        <div style={{ padding: '0.5rem', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '0.75rem', borderRadius: '0.25rem', marginBottom: '0.75rem' }}>
          {state.error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        gap: '0.75rem',
        flexWrap: isHorizontal ? 'wrap' : 'nowrap',
        alignItems: isHorizontal ? 'flex-end' : 'stretch',
      }}>
        <div style={{ flex: isHorizontal ? '1 1 200px' : undefined }}>
          <label style={labelStyle}>Name *</label>
          <input name="name" required style={inputStyle} placeholder="Full name" />
        </div>

        <div style={{ flex: isHorizontal ? '1 1 200px' : undefined }}>
          <label style={labelStyle}>Email *</label>
          <input name="email" type="email" required style={inputStyle} placeholder="Email address" />
        </div>

        {showPhone && (
          <div style={{ flex: isHorizontal ? '1 1 160px' : undefined }}>
            <label style={labelStyle}>Phone</label>
            <input name="phone" type="tel" style={inputStyle} placeholder="Phone" />
          </div>
        )}

        {showCompany && (
          <div style={{ flex: isHorizontal ? '1 1 160px' : undefined }}>
            <label style={labelStyle}>Company</label>
            <input name="company" style={inputStyle} placeholder="Company" />
          </div>
        )}

        <button
          type="submit"
          disabled={state.loading}
          style={{
            padding: '0.625rem 1.5rem',
            backgroundColor: state.loading ? '#94a3b8' : buttonColor,
            color: buttonTextColor,
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: state.loading ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            flex: isHorizontal ? '0 0 auto' : undefined,
          }}
        >
          {state.loading ? '...' : submitText}
        </button>
      </form>
    </div>
  )
}

// =============================================================================
// CRM NEWSLETTER FORM RENDER
// =============================================================================

interface CRMNewsletterFormProps {
  title?: string
  subtitle?: string
  submitText?: string
  successMessage?: string
  layout?: 'inline' | 'stacked' | 'card'
  backgroundColor?: string
  buttonColor?: string
  buttonTextColor?: string
  siteId?: string
}

export function CRMNewsletterFormRender(props: CRMNewsletterFormProps) {
  const {
    title = 'Stay Updated',
    subtitle = 'Subscribe to our newsletter for the latest updates.',
    submitText = 'Subscribe',
    successMessage = "You're subscribed! Check your inbox.",
    layout = 'inline',
    backgroundColor = 'transparent',
    buttonColor = 'var(--brand-primary, #3b82f6)',
    buttonTextColor = 'var(--brand-button-text, #ffffff)',
    siteId,
  } = props

  const [state, setState] = useState<SubmitState>({ loading: false, success: false, error: null })

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setState({ loading: true, success: false, error: null })

    const formData = new FormData(e.currentTarget)
    const data: Record<string, string> = {
      site_id: siteId || '',
      name: formData.get('name') as string || '',
      email: formData.get('email') as string || '',
    }

    try {
      await submitToCRM(data, 'newsletter')
      setState({ loading: false, success: true, error: null })
    } catch (err) {
      setState({ loading: false, success: false, error: (err as Error).message })
    }
  }

  if (state.success) {
    return (
      <div style={{ backgroundColor, padding: '1rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#16a34a' }}>✓ {successMessage}</p>
      </div>
    )
  }

  const isInline = layout === 'inline'
  const isCard = layout === 'card'

  return (
    <div style={{
      backgroundColor,
      padding: isCard ? '2rem' : '1rem',
      borderRadius: isCard ? '0.75rem' : '0',
      ...(isCard ? { boxShadow: shadowMap.md, border: '1px solid #e2e8f0' } : {}),
    }}>
      {title && <h4 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.25rem' }}>{title}</h4>}
      {subtitle && <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.75rem' }}>{subtitle}</p>}

      {state.error && (
        <div style={{ padding: '0.375rem', color: '#dc2626', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
          {state.error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: isInline ? 'row' : 'column',
        gap: '0.5rem',
        alignItems: isInline ? 'center' : 'stretch',
      }}>
        <input
          name="email"
          type="email"
          required
          style={{ ...inputStyle, flex: isInline ? '1' : undefined }}
          placeholder="Enter your email"
        />

        <button
          type="submit"
          disabled={state.loading}
          style={{
            padding: '0.625rem 1.25rem',
            backgroundColor: state.loading ? '#94a3b8' : buttonColor,
            color: buttonTextColor,
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: state.loading ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {state.loading ? '...' : submitText}
        </button>
      </form>
    </div>
  )
}
