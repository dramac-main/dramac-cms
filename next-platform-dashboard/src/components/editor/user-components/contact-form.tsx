"use client";

import { useNode } from "@craftjs/core";

export interface ContactFormProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  showName?: boolean;
  showPhone?: boolean;
  showSubject?: boolean;
  backgroundColor?: string;
  formBackgroundColor?: string;
}

export function ContactForm({
  title = "Get in Touch",
  subtitle = "We'd love to hear from you. Send us a message!",
  buttonText = "Send Message",
  showName = true,
  showPhone = false,
  showSubject = true,
  backgroundColor = "",
  formBackgroundColor = "#ffffff",
}: ContactFormProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <section
      ref={(ref) => {
        if (ref) {
          connect(drag(ref));
        }
      }}
      className="py-16 px-8"
      style={{ backgroundColor }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          {subtitle && <p className="text-lg opacity-80">{subtitle}</p>}
        </div>

        {/* Form */}
        <form
          className="space-y-6 p-8 rounded-xl shadow-sm"
          style={{ backgroundColor: formBackgroundColor }}
          onSubmit={(e) => e.preventDefault()}
        >
          {showName && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Doe"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="john@example.com"
            />
          </div>

          {showPhone && (
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          )}

          {showSubject && (
            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <input
                type="text"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="How can we help?"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <textarea
              rows={5}
              className="w-full px-4 py-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Your message..."
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-6 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            {buttonText}
          </button>
        </form>
      </div>
    </section>
  );
}

ContactForm.craft = {
  displayName: "Contact Form",
  props: {
    title: "Get in Touch",
    subtitle: "We'd love to hear from you. Send us a message!",
    buttonText: "Send Message",
    showName: true,
    showPhone: false,
    showSubject: true,
    backgroundColor: "",
    formBackgroundColor: "#ffffff",
  },
  related: {
    toolbar: () => import("../settings/contact-form-settings").then((m) => m.ContactFormSettings),
  },
  rules: {
    canDrag: () => true,
  },
};
