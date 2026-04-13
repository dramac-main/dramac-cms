"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface ReceiptUploadProps {
  siteId: string;
  value?: string | null;
  filename?: string | null;
  onChange: (url: string | null, filename: string | null) => void;
}

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "application/pdf",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function ReceiptUpload({
  siteId,
  value,
  filename,
  onChange,
}: ReceiptUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error("Unsupported file type. Use JPEG, PNG, PDF, or HEIC.");
        return;
      }
      if (file.size > MAX_SIZE) {
        toast.error("File too large. Maximum size is 10MB.");
        return;
      }

      setUploading(true);
      try {
        const supabase = createClient();
        const ext = file.name.split(".").pop() || "bin";
        const path = `${siteId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error } = await supabase.storage
          .from("invoicing-receipts")
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
          });
        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage.from("invoicing-receipts").getPublicUrl(path);

        onChange(publicUrl, file.name);
        toast.success("Receipt uploaded");
      } catch (err: any) {
        toast.error(err.message || "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [siteId, onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
    },
    [handleUpload],
  );

  const isImage = value && /\.(jpe?g|png|heic|webp)/i.test(value);

  if (value) {
    return (
      <div className="space-y-2">
        <Label>Receipt</Label>
        <div className="flex items-center gap-3 p-3 rounded-md border">
          {isImage ? (
            <ImageIcon className="h-5 w-5 text-muted-foreground shrink-0" />
          ) : (
            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {filename || "Receipt"}
            </p>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              View receipt
            </a>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => onChange(null, null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Receipt</Label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-md p-6 text-center transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          {uploading ? "Uploading..." : "Drag & drop receipt or"}
        </p>
        <label>
          <Input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf,.heic"
            onChange={handleFileInput}
            disabled={uploading}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            disabled={uploading}
            asChild
          >
            <span>Browse Files</span>
          </Button>
        </label>
        <p className="text-xs text-muted-foreground mt-2">
          JPEG, PNG, PDF, HEIC — Max 10MB
        </p>
      </div>
    </div>
  );
}
