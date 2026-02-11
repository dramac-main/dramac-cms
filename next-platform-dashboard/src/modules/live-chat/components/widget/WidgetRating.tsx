'use client'

/**
 * WidgetRating — Post-chat satisfaction rating
 *
 * PHASE LC-04: 5-star rating, comment textarea, thank you state
 */

import { useState, type FormEvent } from 'react'
import type { WidgetPublicSettings } from './ChatWidget'

interface WidgetRatingProps {
  settings: WidgetPublicSettings
  onSubmit: (rating: number, comment?: string) => void
  onClose: () => void
}

export function WidgetRating({
  settings,
  onSubmit,
  onClose,
}: WidgetRatingProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (rating === 0) return

    setIsSubmitting(true)
    await onSubmit(rating, comment.trim() || undefined)
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const displayRating = hoveredRating || rating

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between shrink-0"
        style={{ backgroundColor: settings.primaryColor }}
      >
        <h3
          className="text-sm font-semibold"
          style={{ color: settings.textColor }}
        >
          {isSubmitted ? 'Thank You!' : 'Rate Your Experience'}
        </h3>
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
        /* Thank you state */
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
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-gray-800 mb-1">
            Thank you for your feedback!
          </h4>
          <p className="text-sm text-gray-500 mb-6">
            Your rating helps us improve our service.
          </p>

          {/* Star display */}
          <div className="flex gap-1 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill={star <= rating ? '#f59e0b' : 'none'}
                stroke={star <= rating ? '#f59e0b' : '#d1d5db'}
                strokeWidth="2"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>

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
        /* Rating form */
        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col items-center justify-center px-6"
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: `${settings.primaryColor}15` }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke={settings.primaryColor}
              strokeWidth="1.5"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            How was your experience?
          </p>

          {/* Star selector */}
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-110"
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill={star <= displayRating ? '#f59e0b' : 'none'}
                  stroke={star <= displayRating ? '#f59e0b' : '#d1d5db'}
                  strokeWidth="2"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            ))}
          </div>

          {/* Rating label */}
          {displayRating > 0 && (
            <p className="text-xs text-gray-500 mb-3">
              {displayRating === 1 && 'Poor'}
              {displayRating === 2 && 'Fair'}
              {displayRating === 3 && 'Good'}
              {displayRating === 4 && 'Very Good'}
              {displayRating === 5 && 'Excellent'}
            </p>
          )}

          {/* Comment */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Any additional feedback? (optional)"
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-1 resize-none mb-4"
            style={{
              // @ts-expect-error -- focus ring color
              '--tw-ring-color': settings.primaryColor,
            }}
          />

          <button
            type="submit"
            disabled={rating === 0 || isSubmitting}
            className="w-full py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40"
            style={{
              backgroundColor: settings.primaryColor,
              color: settings.textColor,
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Skip
          </button>
        </form>
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
