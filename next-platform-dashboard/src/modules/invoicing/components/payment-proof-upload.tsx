"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface PaymentProofUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export function PaymentProofUpload({
  value,
  onChange,
  disabled,
}: PaymentProofUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowed = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/pdf",
    ];
    if (!allowed.includes(file.type)) {
      return;
    }
    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    setUploading(true);
    try {
      // Use the existing upload pattern via FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "invoicing");
      formData.append(
        "path",
        `payment-proofs/${crypto.randomUUID()}-${file.name}`,
      );

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onChange(data.url || data.publicUrl || null);
      }
    } catch {
      // Upload failed silently
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Payment Proof</Label>
      {value ? (
        <div className="relative rounded-md border p-2 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground truncate flex-1">
            {value.split("/").pop()}
          </span>
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => onChange(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            className="hidden"
            disabled={disabled || uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-1.5" />
            {uploading ? "Uploading..." : "Upload Proof"}
          </Button>
          <p className="text-xs text-muted-foreground">
            PNG, JPEG, WebP, or PDF. Max 5MB.
          </p>
        </>
      )}
    </div>
  );
}
