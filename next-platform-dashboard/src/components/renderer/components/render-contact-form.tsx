"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface RenderContactFormProps {
  title?: string;
  description?: string;
  nameLabel?: string;
  emailLabel?: string;
  messageLabel?: string;
  submitText?: string;
  successMessage?: string;
  formEndpoint?: string;
  backgroundColor?: string;
  className?: string;
}

export function RenderContactForm({
  title = "Contact Us",
  description,
  nameLabel = "Name",
  emailLabel = "Email",
  messageLabel = "Message",
  submitText = "Send Message",
  successMessage = "Thank you! We'll be in touch soon.",
  formEndpoint,
  backgroundColor = "transparent",
  className,
}: RenderContactFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // If formEndpoint provided, submit to it
    if (formEndpoint) {
      try {
        const formData = new FormData(e.currentTarget);
        await fetch(formEndpoint, {
          method: "POST",
          body: formData,
        });
      } catch (error) {
        console.error("Form submission error:", error);
      }
    }

    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section
        className={cn("px-6 py-16", className)}
        style={{ backgroundColor }}
      >
        <div className="max-w-xl mx-auto text-center">
          <div className="text-4xl mb-4">✓</div>
          <p className="text-lg">{successMessage}</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn("px-6 py-16", className)}
      style={{ backgroundColor }}
    >
      <div className="max-w-xl mx-auto">
        {title && (
          <h2 className="text-3xl font-bold text-center mb-4">{title}</h2>
        )}
        {description && (
          <p className="text-center text-muted-foreground mb-8">{description}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{nameLabel}</label>
            <input
              type="text"
              name="name"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{emailLabel}</label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{messageLabel}</label>
            <textarea
              name="message"
              rows={4}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : submitText}
          </button>
        </form>
      </div>
    </section>
  );
}
