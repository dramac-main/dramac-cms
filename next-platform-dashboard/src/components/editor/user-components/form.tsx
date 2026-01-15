"use client";

import { useNode, Element } from "@craftjs/core";
import { ReactNode } from "react";
import { FormField } from "./form-field";
import { FormSettings } from "../settings/form-settings";

interface FormProps {
  children?: ReactNode;
  submitText?: string;
  successMessage?: string;
  backgroundColor?: string;
  padding?: number;
  borderRadius?: number;
}

export function Form({
  children,
  submitText = "Submit",
  successMessage: _successMessage = "Thank you for your submission!",
  backgroundColor = "#ffffff",
  padding = 24,
  borderRadius = 8,
}: FormProps) {
  const { connectors: { connect, drag } } = useNode();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In editor mode, don't actually submit
  };

  return (
    <form
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      onSubmit={handleSubmit}
      style={{
        backgroundColor,
        padding: `${padding}px`,
        borderRadius: `${borderRadius}px`,
        border: "1px solid #e5e7eb",
      }}
    >
      {children || (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Element id="form-name" is={FormField} canvas={false} label="Name" type="text" placeholder="Your name" required />
          <Element id="form-email" is={FormField} canvas={false} label="Email" type="email" placeholder="your@email.com" required />
          <Element id="form-message" is={FormField} canvas={false} label="Message" type="textarea" placeholder="Your message..." required />
        </div>
      )}
      <button
        type="submit"
        style={{
          marginTop: "16px",
          width: "100%",
          padding: "12px 24px",
          backgroundColor: "#6366f1",
          color: "#ffffff",
          borderRadius: "6px",
          border: "none",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {submitText}
      </button>
    </form>
  );
}

Form.craft = {
  displayName: "Form",
  props: {
    submitText: "Submit",
    successMessage: "Thank you for your submission!",
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 8,
  },
  related: {
    settings: FormSettings,
  },
  rules: {
    canMoveIn: () => true,
  },
};
