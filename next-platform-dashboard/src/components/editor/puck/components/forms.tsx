/**
 * Puck Form Components
 * 
 * Form-related components for user input and data collection.
 */

import type { FormProps, FormFieldProps, ContactFormProps, NewsletterProps } from "@/types/puck";
import { cn } from "@/lib/utils";
import { DropZone } from "@puckeditor/core";
import { Send, Mail, User, Phone, MessageSquare } from "lucide-react";

// Icon map for form fields
const iconMap: Record<string, typeof Mail> = {
  email: Mail,
  name: User,
  phone: Phone,
  message: MessageSquare,
};

/**
 * Form Component
 * Customizable form container with child fields.
 */
export function FormRender({
  submitText = "Submit",
  successMessage = "Form submitted successfully!",
  buttonVariant = "default",
  buttonFullWidth = false,
}: FormProps) {
  const buttonClasses: Record<string, string> = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  };

  return (
    <form
      className="w-full space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        // In editor mode, just prevent default
      }}
    >
      <DropZone zone="form-fields" />
      <button
        type="submit"
        className={cn(
          "px-6 py-3 rounded-md font-medium transition-colors",
          buttonClasses[buttonVariant || "default"],
          buttonFullWidth && "w-full"
        )}
      >
        {submitText}
      </button>
    </form>
  );
}

/**
 * Form Field Component
 * Individual form field (input, textarea, select).
 */
export function FormFieldRender({
  label,
  name,
  type = "text",
  placeholder = "",
  required = false,
  options = [],
  helpText,
  width = "full",
}: FormFieldProps) {
  const widthClasses: Record<string, string> = {
    full: "w-full",
    half: "w-1/2",
    third: "w-1/3",
    quarter: "w-1/4",
  };

  const inputClasses = cn(
    "w-full px-4 py-2 rounded-md border border-input bg-background",
    "placeholder:text-muted-foreground",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
    "disabled:cursor-not-allowed disabled:opacity-50"
  );

  const renderField = () => {
    switch (type) {
      case "textarea":
        return (
          <textarea
            name={name}
            placeholder={placeholder}
            required={required}
            rows={4}
            className={cn(inputClasses, "resize-none")}
          />
        );
      case "select":
        return (
          <select
            name={name}
            required={required}
            className={inputClasses}
          >
            <option value="">{placeholder || "Select an option"}</option>
            {(options || []).map((opt, index) => (
              <option key={index} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      case "checkbox":
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name={name}
              required={required}
              className="w-4 h-4 rounded border-input"
            />
            <span className="text-sm">{placeholder}</span>
          </div>
        );
      default:
        return (
          <input
            type={type}
            name={name}
            placeholder={placeholder}
            required={required}
            className={inputClasses}
          />
        );
    }
  };

  return (
    <div className={cn("space-y-1.5", widthClasses[width || "full"])}>
      {label && type !== "checkbox" && (
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {renderField()}
      {helpText && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}

/**
 * Contact Form Component
 * Pre-built contact form with common fields.
 */
export function ContactFormRender({
  title = "Get in Touch",
  description,
  fields = ["name", "email", "message"],
  submitText = "Send Message",
  backgroundColor,
  showIcons = true,
}: ContactFormProps) {
  const inputClasses = cn(
    "w-full px-4 py-3 rounded-md border border-input bg-background",
    "placeholder:text-muted-foreground",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
    showIcons && "pl-11"
  );

  const IconWrapper = ({ icon: Icon }: { icon: typeof Mail }) => (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
      <Icon className="w-4 h-4" />
    </div>
  );

  // Normalize fields to string array
  const fieldNames = (fields || []).map((f: string | { name: string }) => 
    typeof f === "string" ? f : f.name
  );

  return (
    <div
      className="w-full max-w-lg mx-auto p-6 md:p-8 rounded-lg"
      style={{ backgroundColor: backgroundColor || undefined }}
    >
      {title && (
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
      )}
      {description && (
        <p className="text-muted-foreground mb-6">{description}</p>
      )}
      
      <form
        className="space-y-4"
        onSubmit={(e) => e.preventDefault()}
      >
        {fieldNames.includes("name") && (
          <div className="relative">
            {showIcons && <IconWrapper icon={User} />}
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              required
              className={inputClasses}
            />
          </div>
        )}
        
        {fieldNames.includes("email") && (
          <div className="relative">
            {showIcons && <IconWrapper icon={Mail} />}
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              required
              className={inputClasses}
            />
          </div>
        )}
        
        {fieldNames.includes("phone") && (
          <div className="relative">
            {showIcons && <IconWrapper icon={Phone} />}
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              className={inputClasses}
            />
          </div>
        )}
        
        {fieldNames.includes("subject") && (
          <input
            type="text"
            name="subject"
            placeholder="Subject"
            className="w-full px-4 py-3 rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        )}
        
        {fieldNames.includes("message") && (
          <div className="relative">
            <textarea
              name="message"
              placeholder="Your Message"
              required
              rows={5}
              className={cn(inputClasses, "resize-none", showIcons && "pt-3")}
            />
            {showIcons && (
              <div className="absolute left-4 top-3 text-muted-foreground">
                <MessageSquare className="w-4 h-4" />
              </div>
            )}
          </div>
        )}
        
        <button
          type="submit"
          className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          {submitText}
        </button>
      </form>
    </div>
  );
}

/**
 * Newsletter Component
 * Email subscription form.
 */
export function NewsletterRender({
  title = "Subscribe to our newsletter",
  description,
  placeholder = "Enter your email",
  buttonText = "Subscribe",
  layout = "inline",
  backgroundColor,
}: NewsletterProps) {
  const isStacked = layout === "stacked";

  return (
    <div
      className="w-full p-6 md:p-8 rounded-lg"
      style={{ backgroundColor: backgroundColor || undefined }}
    >
      {title && (
        <h3 className={cn("font-bold", isStacked ? "text-xl mb-2" : "text-lg mb-2")}>
          {title}
        </h3>
      )}
      {description && (
        <p className="text-muted-foreground mb-4 text-sm">{description}</p>
      )}
      
      <form
        className={cn(
          isStacked ? "space-y-3" : "flex flex-col sm:flex-row gap-3"
        )}
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          type="email"
          name="email"
          placeholder={placeholder}
          required
          className={cn(
            "px-4 py-3 rounded-md border border-input bg-background",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
            isStacked ? "w-full" : "flex-1"
          )}
        />
        <button
          type="submit"
          className={cn(
            "px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium",
            "hover:bg-primary/90 transition-colors",
            "whitespace-nowrap flex items-center justify-center gap-2"
          )}
        >
          <Mail className="w-4 h-4" />
          {buttonText}
        </button>
      </form>
    </div>
  );
}
