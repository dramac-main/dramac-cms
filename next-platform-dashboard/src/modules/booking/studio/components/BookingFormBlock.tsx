/**
 * Booking Form Block - Studio Component
 * 
 * Customer details form for completing a booking.
 * 50+ customization properties with full theme support.
 * 
 * @module booking
 */
'use client'

import React, { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { User, Mail, Phone, FileText, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import type { ComponentDefinition } from '@/types/studio'
import { useCreateBooking } from '../../hooks/useCreateBooking'

// =============================================================================
// TYPES
// =============================================================================

export interface BookingFormBlockProps {
  // Content
  title?: string
  subtitle?: string
  showHeader?: boolean
  showIcon?: boolean
  submitButtonText?: string
  submittingText?: string
  successTitle?: string
  successMessage?: string
  errorMessage?: string
  requiredLabel?: string
  optionalLabel?: string

  // Form Fields
  showNameField?: boolean
  showEmailField?: boolean
  showPhoneField?: boolean
  showNotesField?: boolean
  showCompanyField?: boolean
  showAddressField?: boolean
  nameLabel?: string
  emailLabel?: string
  phoneLabel?: string
  notesLabel?: string
  companyLabel?: string
  addressLabel?: string
  namePlaceholder?: string
  emailPlaceholder?: string
  phonePlaceholder?: string
  notesPlaceholder?: string
  companyPlaceholder?: string
  addressPlaceholder?: string
  nameRequired?: boolean
  emailRequired?: boolean
  phoneRequired?: boolean
  notesRequired?: boolean
  notesMaxLength?: number
  notesRows?: number

  // Data
  siteId?: string
  serviceId?: string
  staffId?: string

  // Validation
  showValidation?: boolean
  validateOnBlur?: boolean
  showRequiredAsterisk?: boolean

  // Layout
  layout?: 'single-column' | 'two-column' | 'compact'
  headerAlignment?: 'left' | 'center' | 'right'
  width?: string
  minHeight?: string
  padding?: string
  gap?: string
  fieldGap?: string
  labelPosition?: 'top' | 'left' | 'floating'

  // Style - Colors
  primaryColor?: string
  backgroundColor?: string
  textColor?: string
  headerBackgroundColor?: string
  headerTextColor?: string
  labelColor?: string
  inputBackgroundColor?: string
  inputBorderColor?: string
  inputFocusBorderColor?: string
  inputTextColor?: string
  inputPlaceholderColor?: string
  buttonBackgroundColor?: string
  buttonTextColor?: string
  buttonHoverColor?: string
  errorColor?: string
  successColor?: string
  successBgColor?: string
  requiredAsteriskColor?: string
  borderColor?: string
  dividerColor?: string
  iconColor?: string

  // Typography
  titleFontSize?: string
  titleFontWeight?: string
  titleFontFamily?: string
  subtitleFontSize?: string
  labelFontSize?: string
  labelFontWeight?: string
  inputFontSize?: string
  buttonFontSize?: string
  buttonFontWeight?: string
  errorFontSize?: string
  successFontSize?: string
  successFontWeight?: string

  // Shape & Effects
  borderRadius?: string
  inputBorderRadius?: string
  buttonBorderRadius?: string
  borderWidth?: string
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  inputShadow?: 'none' | 'sm' | 'md'
  buttonFullWidth?: boolean
  animateSubmit?: boolean
  showSuccessAnimation?: boolean

  // Accessibility
  ariaLabel?: string

  // Events
  className?: string
  onSubmit?: (data: Record<string, string>) => void
}

// =============================================================================
// HELPERS
// =============================================================================

const SHADOW_MAP: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px -1px rgba(0,0,0,0.1)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.1)',
  xl: '0 20px 25px -5px rgba(0,0,0,0.1)',
}

// =============================================================================
// COMPONENT
// =============================================================================

export function BookingFormBlock({
  // Content
  title = 'Your Details',
  subtitle = 'Please provide your information to complete the booking.',
  showHeader = true,
  showIcon = true,
  submitButtonText = 'Confirm Booking',
  submittingText = 'Submitting...',
  successTitle = 'Booking Confirmed!',
  successMessage = 'Your appointment has been booked successfully. You will receive a confirmation email shortly.',
  errorMessage = 'Something went wrong. Please try again.',
  requiredLabel = 'Required',
  optionalLabel = 'Optional',

  // Form Fields
  showNameField = true,
  showEmailField = true,
  showPhoneField = true,
  showNotesField = true,
  showCompanyField = false,
  showAddressField = false,
  nameLabel = 'Full Name',
  emailLabel = 'Email Address',
  phoneLabel = 'Phone Number',
  notesLabel = 'Notes',
  companyLabel = 'Company',
  addressLabel = 'Address',
  namePlaceholder = 'Enter your full name',
  emailPlaceholder = 'you@example.com',
  phonePlaceholder = '+1 (555) 000-0000',
  notesPlaceholder = 'Any special requests or notes...',
  companyPlaceholder = 'Your company name',
  addressPlaceholder = 'Your address',
  nameRequired = true,
  emailRequired = true,
  phoneRequired = false,
  notesRequired = false,
  notesMaxLength = 500,
  notesRows = 3,

  // Data
  siteId,
  serviceId,
  staffId,

  // Validation
  showValidation = true,
  validateOnBlur = true,
  showRequiredAsterisk = true,

  // Layout
  layout = 'single-column',
  headerAlignment = 'left',
  width,
  minHeight,
  padding = '20px',
  gap = '16px',
  fieldGap = '12px',
  labelPosition = 'top',

  // Colors
  primaryColor = '#8B5CF6',
  backgroundColor,
  textColor,
  headerBackgroundColor,
  headerTextColor,
  labelColor,
  inputBackgroundColor,
  inputBorderColor,
  inputFocusBorderColor,
  inputTextColor,
  inputPlaceholderColor,
  buttonBackgroundColor,
  buttonTextColor = '#ffffff',
  buttonHoverColor,
  errorColor = '#ef4444',
  successColor = '#22c55e',
  successBgColor,
  requiredAsteriskColor,
  borderColor,
  dividerColor,
  iconColor,

  // Typography
  titleFontSize = '18px',
  titleFontWeight = '600',
  titleFontFamily,
  subtitleFontSize = '14px',
  labelFontSize = '14px',
  labelFontWeight = '500',
  inputFontSize = '14px',
  buttonFontSize = '14px',
  buttonFontWeight = '600',
  errorFontSize = '12px',
  successFontSize = '15px',
  successFontWeight = '600',

  // Shape & Effects
  borderRadius = '12px',
  inputBorderRadius = '8px',
  buttonBorderRadius = '8px',
  borderWidth = '1px',
  shadow = 'sm',
  inputShadow = 'none',
  buttonFullWidth = true,
  animateSubmit = true,
  showSuccessAnimation = true,

  // Accessibility
  ariaLabel = 'Booking Form',

  // Events
  className,
  onSubmit,
}: BookingFormBlockProps) {
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [submitError, setSubmitError] = useState(false)

  // Real booking creation hook — only active when siteId exists
  const { createBooking } = useCreateBooking(siteId || '')

  const btnBg = buttonBackgroundColor || primaryColor
  const focusBorder = inputFocusBorderColor || primaryColor
  const asteriskColor = requiredAsteriskColor || errorColor
  const successBg = successBgColor || `${successColor}08`

  const validate = useCallback((field: string, value: string): string => {
    if (field === 'name' && nameRequired && !value.trim()) return `${nameLabel} is required`
    if (field === 'email' && emailRequired && !value.trim()) return `${emailLabel} is required`
    if (field === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email'
    if (field === 'phone' && phoneRequired && !value.trim()) return `${phoneLabel} is required`
    if (field === 'notes' && notesRequired && !value.trim()) return `${notesLabel} is required`
    return ''
  }, [nameRequired, emailRequired, phoneRequired, notesRequired, nameLabel, emailLabel, phoneLabel, notesLabel])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (touched[field] && showValidation) {
      const error = validate(field, value)
      setErrors(prev => ({ ...prev, [field]: error }))
    }
  }

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    if (validateOnBlur && showValidation) {
      const error = validate(field, formData[field] || '')
      setErrors(prev => ({ ...prev, [field]: error }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all
    const fields = []
    if (showNameField) fields.push('name')
    if (showEmailField) fields.push('email')
    if (showPhoneField) fields.push('phone')
    if (showNotesField) fields.push('notes')
    if (showCompanyField) fields.push('company')
    if (showAddressField) fields.push('address')

    const newErrors: Record<string, string> = {}
    fields.forEach(f => { newErrors[f] = validate(f, formData[f] || '') })
    setErrors(newErrors)
    setTouched(Object.fromEntries(fields.map(f => [f, true])))

    if (Object.values(newErrors).some(e => e)) return

    setIsSubmitting(true)
    setSubmitError(false)

    try {
      // If siteId is available, create a REAL appointment in the database
      if (siteId && serviceId) {
        await createBooking({
          service_id: serviceId,
          staff_id: staffId || undefined,
          customer_name: formData.name || 'Guest',
          customer_email: formData.email || undefined,
          customer_phone: formData.phone || undefined,
          customer_notes: formData.notes || undefined,
          // Start/end times should be passed via props from a parent widget
          start_time: formData._startTime || new Date().toISOString(),
          end_time: formData._endTime || new Date(Date.now() + 3600000).toISOString(),
          status: 'pending',
          payment_status: 'not_required',
          metadata: {
            company: formData.company,
            address: formData.address,
            source: 'website_form',
          },
        })
      } else {
        // Demo mode — just simulate
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
      onSubmit?.(formData)
      setIsSuccess(true)
    } catch {
      setSubmitError(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: string, label: string, placeholder: string, required: boolean, icon: React.ReactNode, type: 'text' | 'email' | 'tel' | 'textarea' = 'text') => (
    <div key={field} style={{ display: 'flex', flexDirection: labelPosition === 'left' ? 'row' : 'column', gap: labelPosition === 'left' ? '12px' : '4px', alignItems: labelPosition === 'left' ? 'center' : undefined }}>
      <label style={{
        fontSize: labelFontSize, fontWeight: labelFontWeight, color: labelColor || undefined,
        display: 'flex', alignItems: 'center', gap: '4px',
        minWidth: labelPosition === 'left' ? '120px' : undefined,
      }}>
        {showIcon && icon}
        {label}
        {showRequiredAsterisk && required && <span style={{ color: asteriskColor }}>*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          value={formData[field] || ''}
          onChange={(e) => handleChange(field, e.target.value)}
          onBlur={() => handleBlur(field)}
          placeholder={placeholder}
          rows={notesRows}
          maxLength={notesMaxLength}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: inputBorderRadius,
            border: `${borderWidth} solid ${errors[field] && touched[field] ? errorColor : (inputBorderColor || '#e5e7eb')}`,
            backgroundColor: inputBackgroundColor || undefined,
            color: inputTextColor || undefined,
            fontSize: inputFontSize, resize: 'vertical', outline: 'none',
            boxShadow: SHADOW_MAP[inputShadow] || 'none',
            transition: 'border-color 0.15s ease',
          }}
          onFocus={(e) => e.target.style.borderColor = focusBorder}
          aria-required={required}
          aria-invalid={!!(errors[field] && touched[field])}
        />
      ) : (
        <input
          type={type}
          value={formData[field] || ''}
          onChange={(e) => handleChange(field, e.target.value)}
          onBlur={() => handleBlur(field)}
          placeholder={placeholder}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: inputBorderRadius,
            border: `${borderWidth} solid ${errors[field] && touched[field] ? errorColor : (inputBorderColor || '#e5e7eb')}`,
            backgroundColor: inputBackgroundColor || undefined,
            color: inputTextColor || undefined,
            fontSize: inputFontSize, outline: 'none',
            boxShadow: SHADOW_MAP[inputShadow] || 'none',
            transition: 'border-color 0.15s ease',
          }}
          onFocus={(e) => e.target.style.borderColor = focusBorder}
          aria-required={required}
          aria-invalid={!!(errors[field] && touched[field])}
        />
      )}
      {showValidation && errors[field] && touched[field] && (
        <span style={{ fontSize: errorFontSize, color: errorColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertCircle style={{ width: 12, height: 12 }} />
          {errors[field]}
        </span>
      )}
    </div>
  )

  // Success State
  if (isSuccess) {
    return (
      <div
        className={cn('booking-form-block', className)}
        style={{
          backgroundColor: successBg,
          borderRadius,
          border: `${borderWidth} solid ${successColor}30`,
          padding: '40px 20px',
          textAlign: 'center',
          width: width || '100%',
        }}
        role="status"
      >
        <div style={{
          width: 56, height: 56, borderRadius: '50%', backgroundColor: `${successColor}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          animation: showSuccessAnimation ? 'bounceIn 0.5s ease' : undefined,
        }}>
          <CheckCircle style={{ width: 28, height: 28, color: successColor }} />
        </div>
        <h3 style={{ fontWeight: successFontWeight, fontSize: successFontSize, margin: '0 0 8px', color: successColor }}>{successTitle}</h3>
        <p style={{ fontSize: '14px', opacity: 0.7, margin: 0, lineHeight: 1.5 }}>{successMessage}</p>
        <style>{`@keyframes bounceIn { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }`}</style>
      </div>
    )
  }

  const isTwoCol = layout === 'two-column'

  return (
    <div
      className={cn('booking-form-block', className)}
      style={{
        backgroundColor: backgroundColor || undefined,
        color: textColor || undefined,
        borderRadius,
        border: `${borderWidth} solid ${borderColor || '#e5e7eb'}`,
        boxShadow: SHADOW_MAP[shadow] || 'none',
        width: width || '100%',
        minHeight: minHeight || undefined,
        fontFamily: titleFontFamily || undefined,
        overflow: 'hidden',
      }}
      role="region"
      aria-label={ariaLabel}
    >
      {/* Header */}
      {showHeader && (
        <div style={{
          padding,
          backgroundColor: headerBackgroundColor || undefined,
          color: headerTextColor || textColor || undefined,
          borderBottom: `1px solid ${dividerColor || borderColor || '#e5e7eb'}`,
          textAlign: headerAlignment,
        }}>
          <h3 style={{ fontWeight: titleFontWeight, fontSize: titleFontSize, margin: 0 }}>{title}</h3>
          {subtitle && <p style={{ fontSize: subtitleFontSize, opacity: 0.7, marginTop: '4px', marginBottom: 0 }}>{subtitle}</p>}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ padding }}>
        <div style={{
          display: isTwoCol ? 'grid' : 'flex',
          gridTemplateColumns: isTwoCol ? 'repeat(2, 1fr)' : undefined,
          flexDirection: !isTwoCol ? 'column' : undefined,
          gap: fieldGap,
        }}>
          {showNameField && renderField('name', nameLabel, namePlaceholder, nameRequired, <User style={{ width: 14, height: 14, color: iconColor || primaryColor, opacity: 0.7 }} />)}
          {showEmailField && renderField('email', emailLabel, emailPlaceholder, emailRequired, <Mail style={{ width: 14, height: 14, color: iconColor || primaryColor, opacity: 0.7 }} />, 'email')}
          {showPhoneField && renderField('phone', phoneLabel, phonePlaceholder, phoneRequired, <Phone style={{ width: 14, height: 14, color: iconColor || primaryColor, opacity: 0.7 }} />, 'tel')}
          {showCompanyField && renderField('company', companyLabel, companyPlaceholder, false, <FileText style={{ width: 14, height: 14, color: iconColor || primaryColor, opacity: 0.7 }} />)}
          {showAddressField && renderField('address', addressLabel, addressPlaceholder, false, <FileText style={{ width: 14, height: 14, color: iconColor || primaryColor, opacity: 0.7 }} />)}
          {showNotesField && (
            <div style={{ gridColumn: isTwoCol ? '1 / -1' : undefined }}>
              {renderField('notes', notesLabel, notesPlaceholder, notesRequired, <FileText style={{ width: 14, height: 14, color: iconColor || primaryColor, opacity: 0.7 }} />, 'textarea')}
            </div>
          )}
        </div>

        {/* Error message */}
        {submitError && (
          <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: `${errorColor}10`, color: errorColor, fontSize: errorFontSize, marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle style={{ width: 14, height: 14 }} />
            {errorMessage}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            marginTop: gap,
            width: buttonFullWidth ? '100%' : 'auto',
            padding: '12px 24px',
            borderRadius: buttonBorderRadius,
            backgroundColor: isSubmitting ? `${btnBg}80` : btnBg,
            color: buttonTextColor,
            fontSize: buttonFontSize,
            fontWeight: buttonFontWeight,
            border: 'none',
            cursor: isSubmitting ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: animateSubmit ? 'all 0.2s ease' : 'none',
          }}
          onMouseEnter={(e) => { if (!isSubmitting && buttonHoverColor) (e.target as HTMLElement).style.backgroundColor = buttonHoverColor }}
          onMouseLeave={(e) => { if (!isSubmitting) (e.target as HTMLElement).style.backgroundColor = btnBg }}
        >
          {isSubmitting ? (
            <>
              <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
              {submittingText}
            </>
          ) : (
            <>
              <Send style={{ width: 16, height: 16 }} />
              {submitButtonText}
            </>
          )}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </form>
    </div>
  )
}

// =============================================================================
// STUDIO DEFINITION — 50+ fields with field groups
// =============================================================================

export const bookingFormDefinition: ComponentDefinition = {
  type: 'BookingForm',
  label: 'Booking Form',
  description: 'Customer details form for completing a booking — 50+ customization options',
  category: 'forms',
  icon: 'FileText',
  keywords: ['booking', 'form', 'customer', 'details', 'appointment', 'contact', 'input'],
  defaultProps: {
    title: 'Your Details',
    subtitle: 'Please provide your information to complete the booking.',
    showHeader: true,
    showIcon: true,
    showNameField: true,
    showEmailField: true,
    showPhoneField: true,
    showNotesField: true,
    showCompanyField: false,
    showAddressField: false,
    nameRequired: true,
    emailRequired: true,
    phoneRequired: false,
    notesRequired: false,
    notesRows: 3,
    notesMaxLength: 500,
    showValidation: true,
    validateOnBlur: true,
    showRequiredAsterisk: true,
    layout: 'single-column',
    headerAlignment: 'left',
    labelPosition: 'top',
    primaryColor: '#8B5CF6',
    buttonTextColor: '#ffffff',
    errorColor: '#ef4444',
    successColor: '#22c55e',
    borderRadius: '12px',
    inputBorderRadius: '8px',
    buttonBorderRadius: '8px',
    borderWidth: '1px',
    shadow: 'sm',
    inputShadow: 'none',
    buttonFullWidth: true,
    animateSubmit: true,
    showSuccessAnimation: true,
    titleFontSize: '18px',
    titleFontWeight: '600',
    buttonFontSize: '14px',
    buttonFontWeight: '600',
    padding: '20px',
    gap: '16px',
    fieldGap: '12px',
  },
  fields: {
    // Content (11)
    title: { type: 'text', label: 'Title' },
    subtitle: { type: 'text', label: 'Subtitle' },
    showHeader: { type: 'toggle', label: 'Show Header' },
    showIcon: { type: 'toggle', label: 'Show Field Icons' },
    submitButtonText: { type: 'text', label: 'Submit Button Text' },
    submittingText: { type: 'text', label: 'Submitting Text' },
    successTitle: { type: 'text', label: 'Success Title' },
    successMessage: { type: 'text', label: 'Success Message' },
    errorMessage: { type: 'text', label: 'Error Message' },
    requiredLabel: { type: 'text', label: 'Required Label' },
    optionalLabel: { type: 'text', label: 'Optional Label' },

    // Form Fields (20)
    showNameField: { type: 'toggle', label: 'Show Name Field' },
    showEmailField: { type: 'toggle', label: 'Show Email Field' },
    showPhoneField: { type: 'toggle', label: 'Show Phone Field' },
    showNotesField: { type: 'toggle', label: 'Show Notes Field' },
    showCompanyField: { type: 'toggle', label: 'Show Company Field' },
    showAddressField: { type: 'toggle', label: 'Show Address Field' },
    nameLabel: { type: 'text', label: 'Name Label' },
    emailLabel: { type: 'text', label: 'Email Label' },
    phoneLabel: { type: 'text', label: 'Phone Label' },
    notesLabel: { type: 'text', label: 'Notes Label' },
    companyLabel: { type: 'text', label: 'Company Label' },
    addressLabel: { type: 'text', label: 'Address Label' },
    namePlaceholder: { type: 'text', label: 'Name Placeholder' },
    emailPlaceholder: { type: 'text', label: 'Email Placeholder' },
    phonePlaceholder: { type: 'text', label: 'Phone Placeholder' },
    notesPlaceholder: { type: 'text', label: 'Notes Placeholder' },
    nameRequired: { type: 'toggle', label: 'Name Required' },
    emailRequired: { type: 'toggle', label: 'Email Required' },
    phoneRequired: { type: 'toggle', label: 'Phone Required' },
    notesMaxLength: { type: 'number', label: 'Notes Max Length', min: 50, max: 2000 },

    // Data (2)
    serviceId: { type: 'custom', customType: 'booking:service-selector', label: 'Pre-Selected Service' },
    staffId: { type: 'custom', customType: 'booking:staff-selector', label: 'Pre-Selected Staff' },

    // Validation (3)
    showValidation: { type: 'toggle', label: 'Show Validation' },
    validateOnBlur: { type: 'toggle', label: 'Validate on Blur' },
    showRequiredAsterisk: { type: 'toggle', label: 'Show Required Asterisk' },

    // Layout (8)
    layout: { type: 'select', label: 'Layout', options: [{ label: 'Single Column', value: 'single-column' }, { label: 'Two Column', value: 'two-column' }, { label: 'Compact', value: 'compact' }] },
    headerAlignment: { type: 'select', label: 'Header Alignment', options: [{ label: 'Left', value: 'left' }, { label: 'Center', value: 'center' }, { label: 'Right', value: 'right' }] },
    labelPosition: { type: 'select', label: 'Label Position', options: [{ label: 'Top', value: 'top' }, { label: 'Left', value: 'left' }, { label: 'Floating', value: 'floating' }] },
    width: { type: 'text', label: 'Width' },
    minHeight: { type: 'text', label: 'Min Height' },
    padding: { type: 'text', label: 'Padding' },
    gap: { type: 'text', label: 'Gap' },
    fieldGap: { type: 'text', label: 'Field Gap' },

    // Colors (21)
    primaryColor: { type: 'color', label: 'Primary Color' },
    backgroundColor: { type: 'color', label: 'Background Color' },
    textColor: { type: 'color', label: 'Text Color' },
    headerBackgroundColor: { type: 'color', label: 'Header Background' },
    headerTextColor: { type: 'color', label: 'Header Text' },
    labelColor: { type: 'color', label: 'Label Color' },
    inputBackgroundColor: { type: 'color', label: 'Input Background' },
    inputBorderColor: { type: 'color', label: 'Input Border' },
    inputFocusBorderColor: { type: 'color', label: 'Input Focus Border' },
    inputTextColor: { type: 'color', label: 'Input Text' },
    buttonBackgroundColor: { type: 'color', label: 'Button Background' },
    buttonTextColor: { type: 'color', label: 'Button Text' },
    buttonHoverColor: { type: 'color', label: 'Button Hover' },
    errorColor: { type: 'color', label: 'Error Color' },
    successColor: { type: 'color', label: 'Success Color' },
    successBgColor: { type: 'color', label: 'Success Background' },
    requiredAsteriskColor: { type: 'color', label: 'Asterisk Color' },
    borderColor: { type: 'color', label: 'Border Color' },
    dividerColor: { type: 'color', label: 'Divider Color' },
    iconColor: { type: 'color', label: 'Icon Color' },
    inputPlaceholderColor: { type: 'color', label: 'Placeholder Color' },

    // Typography (12)
    titleFontSize: { type: 'text', label: 'Title Font Size' },
    titleFontWeight: { type: 'select', label: 'Title Weight', options: [{ label: 'Normal', value: '400' }, { label: 'Medium', value: '500' }, { label: 'Semi Bold', value: '600' }, { label: 'Bold', value: '700' }] },
    titleFontFamily: { type: 'text', label: 'Title Font Family' },
    subtitleFontSize: { type: 'text', label: 'Subtitle Font Size' },
    labelFontSize: { type: 'text', label: 'Label Font Size' },
    labelFontWeight: { type: 'select', label: 'Label Weight', options: [{ label: 'Normal', value: '400' }, { label: 'Medium', value: '500' }, { label: 'Semi Bold', value: '600' }, { label: 'Bold', value: '700' }] },
    inputFontSize: { type: 'text', label: 'Input Font Size' },
    buttonFontSize: { type: 'text', label: 'Button Font Size' },
    buttonFontWeight: { type: 'select', label: 'Button Weight', options: [{ label: 'Normal', value: '400' }, { label: 'Medium', value: '500' }, { label: 'Semi Bold', value: '600' }, { label: 'Bold', value: '700' }] },
    errorFontSize: { type: 'text', label: 'Error Font Size' },
    successFontSize: { type: 'text', label: 'Success Font Size' },
    successFontWeight: { type: 'select', label: 'Success Weight', options: [{ label: 'Normal', value: '400' }, { label: 'Medium', value: '500' }, { label: 'Semi Bold', value: '600' }, { label: 'Bold', value: '700' }] },

    // Shape & Effects (9)
    borderRadius: { type: 'text', label: 'Container Radius' },
    inputBorderRadius: { type: 'text', label: 'Input Radius' },
    buttonBorderRadius: { type: 'text', label: 'Button Radius' },
    borderWidth: { type: 'text', label: 'Border Width' },
    shadow: { type: 'select', label: 'Container Shadow', options: [{ label: 'None', value: 'none' }, { label: 'Small', value: 'sm' }, { label: 'Medium', value: 'md' }, { label: 'Large', value: 'lg' }, { label: 'Extra Large', value: 'xl' }] },
    inputShadow: { type: 'select', label: 'Input Shadow', options: [{ label: 'None', value: 'none' }, { label: 'Small', value: 'sm' }, { label: 'Medium', value: 'md' }] },
    buttonFullWidth: { type: 'toggle', label: 'Full Width Button' },
    animateSubmit: { type: 'toggle', label: 'Animate Submit' },
    showSuccessAnimation: { type: 'toggle', label: 'Success Animation' },

    // Accessibility (1)
    ariaLabel: { type: 'text', label: 'ARIA Label' },
  },
  fieldGroups: [
    { id: 'content', label: 'Content', icon: 'Type', fields: ['title', 'subtitle', 'showHeader', 'showIcon', 'submitButtonText', 'submittingText', 'successTitle', 'successMessage', 'errorMessage', 'requiredLabel', 'optionalLabel'], defaultExpanded: true },
    { id: 'formFields', label: 'Form Fields', icon: 'FormInput', fields: ['showNameField', 'showEmailField', 'showPhoneField', 'showNotesField', 'showCompanyField', 'showAddressField', 'nameLabel', 'emailLabel', 'phoneLabel', 'notesLabel', 'companyLabel', 'addressLabel', 'namePlaceholder', 'emailPlaceholder', 'phonePlaceholder', 'notesPlaceholder', 'nameRequired', 'emailRequired', 'phoneRequired', 'notesMaxLength'], defaultExpanded: true },
    { id: 'data', label: 'Data Connection', icon: 'Database', fields: ['serviceId', 'staffId'], defaultExpanded: false },
    { id: 'validation', label: 'Validation', icon: 'ShieldCheck', fields: ['showValidation', 'validateOnBlur', 'showRequiredAsterisk'], defaultExpanded: false },
    { id: 'layout', label: 'Layout', icon: 'Layout', fields: ['layout', 'headerAlignment', 'labelPosition', 'width', 'minHeight', 'padding', 'gap', 'fieldGap'], defaultExpanded: false },
    { id: 'colors', label: 'Colors', icon: 'Palette', fields: ['primaryColor', 'backgroundColor', 'textColor', 'headerBackgroundColor', 'headerTextColor', 'labelColor', 'inputBackgroundColor', 'inputBorderColor', 'inputFocusBorderColor', 'inputTextColor', 'buttonBackgroundColor', 'buttonTextColor', 'buttonHoverColor', 'errorColor', 'successColor', 'successBgColor', 'requiredAsteriskColor', 'borderColor', 'dividerColor', 'iconColor', 'inputPlaceholderColor'], defaultExpanded: false },
    { id: 'typography', label: 'Typography', icon: 'ALargeSmall', fields: ['titleFontSize', 'titleFontWeight', 'titleFontFamily', 'subtitleFontSize', 'labelFontSize', 'labelFontWeight', 'inputFontSize', 'buttonFontSize', 'buttonFontWeight', 'errorFontSize', 'successFontSize', 'successFontWeight'], defaultExpanded: false },
    { id: 'shape', label: 'Shape & Effects', icon: 'Square', fields: ['borderRadius', 'inputBorderRadius', 'buttonBorderRadius', 'borderWidth', 'shadow', 'inputShadow', 'buttonFullWidth', 'animateSubmit', 'showSuccessAnimation'], defaultExpanded: false },
    { id: 'accessibility', label: 'Accessibility', icon: 'Accessibility', fields: ['ariaLabel'], defaultExpanded: false },
  ],
  ai: {
    description: 'Booking form for customer details — fully customizable with 50+ properties',
    canModify: ['title', 'subtitle', 'layout', 'primaryColor', 'backgroundColor', 'showNameField', 'showEmailField', 'showPhoneField', 'showNotesField', 'showCompanyField', 'buttonFullWidth', 'labelPosition'],
    suggestions: ['Use two-column layout', 'Add company field', 'Change to brand colors', 'Make compact', 'Add address field'],
  },
  render: BookingFormBlock,
}

export default BookingFormBlock
