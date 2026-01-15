"use client";

import { useNode } from "@craftjs/core";
import { FormFieldSettings } from "../settings/form-field-settings";

interface FormFieldProps {
  label?: string;
  type?: "text" | "email" | "tel" | "number" | "textarea" | "select";
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

export function FormField({
  label = "Field Label",
  type = "text",
  placeholder = "",
  required = false,
  options = [],
}: FormFieldProps) {
  const { connectors: { connect, drag } } = useNode();

  const inputStyles = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    backgroundColor: "#ffffff",
  };

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{ display: "flex", flexDirection: "column", gap: "4px" }}
    >
      <label
        style={{
          fontSize: "14px",
          fontWeight: 500,
          color: "#374151",
        }}
      >
        {label}
        {required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      {type === "textarea" ? (
        <textarea
          placeholder={placeholder}
          required={required}
          style={{
            ...inputStyles,
            minHeight: "100px",
            resize: "vertical",
          }}
        />
      ) : type === "select" ? (
        <select style={inputStyles} required={required}>
          <option value="">{placeholder || "Select an option"}</option>
          {options.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          required={required}
          style={inputStyles}
        />
      )}
    </div>
  );
}

FormField.craft = {
  displayName: "Form Field",
  props: {
    label: "Field Label",
    type: "text",
    placeholder: "",
    required: false,
    options: [],
  },
  related: {
    settings: FormFieldSettings,
  },
};
