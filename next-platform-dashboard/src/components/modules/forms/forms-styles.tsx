"use client";

interface FormsStylesProps {
  settings: Record<string, unknown>;
}

export default function FormsStyles({ settings }: FormsStylesProps) {
  // Inject custom form styles
  return (
    <style jsx global>{`
      .dramac-form {
        --form-primary: var(--primary);
        --form-border: var(--border);
      }
      .dramac-form input,
      .dramac-form textarea {
        transition: border-color 0.2s;
      }
      .dramac-form input:focus,
      .dramac-form textarea:focus {
        border-color: var(--form-primary);
        outline: none;
        box-shadow: 0 0 0 2px rgb(var(--form-primary) / 0.1);
      }
    `}</style>
  );
}
