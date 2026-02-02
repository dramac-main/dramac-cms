// src/lib/studio/fields/image-field-editor.tsx
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { ImageFieldEditorProps, ImageValue } from '@/types/studio';
import { 
  Image as ImageIcon, 
  Upload, 
  X, 
  Link2, 
  AlertCircle,
  Loader2 
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Default empty image value
const DEFAULT_IMAGE: ImageValue = {
  url: '',
  alt: '',
};

export function ImageFieldEditor({
  value = DEFAULT_IMAGE,
  onChange,
  label,
  description,
  disabled = false,
  accepts = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
}: ImageFieldEditorProps) {
  const [urlInput, setUrlInput] = React.useState(value?.url || '');
  const [isLoading, setIsLoading] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<string>('url');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Sync URL input with value
  React.useEffect(() => {
    setUrlInput(value?.url || '');
    setImageError(false);
  }, [value?.url]);
  
  // Handle URL input change
  const handleUrlChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrlInput(newUrl);
    setImageError(false);
  }, []);
  
  // Handle URL input blur - commit the change
  const handleUrlBlur = React.useCallback(() => {
    if (urlInput !== value?.url) {
      onChange({
        ...value,
        url: urlInput,
      });
    }
  }, [urlInput, value, onChange]);
  
  // Handle URL input Enter key
  const handleUrlKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUrlBlur();
    }
  }, [handleUrlBlur]);
  
  // Handle alt text change
  const handleAltChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      alt: e.target.value,
    });
  }, [value, onChange]);
  
  // Handle file upload
  const handleFileChange = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!accepts.includes(file.type)) {
      alert(`Invalid file type. Accepted: ${accepts.join(', ')}`);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // TODO: Integrate with actual media library upload
      // For now, create a local object URL for preview
      // In production, this should upload to Supabase storage
      
      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Attempt upload to media library API
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        onChange({
          url: data.url,
          alt: value?.alt || file.name.replace(/\.[^/.]+$/, ''),
          width: data.width,
          height: data.height,
        });
      } else {
        // Fallback: Use object URL for development
        const objectUrl = URL.createObjectURL(file);
        onChange({
          url: objectUrl,
          alt: value?.alt || file.name.replace(/\.[^/.]+$/, ''),
        });
      }
    } catch {
      // Fallback: Use object URL for development
      const objectUrl = URL.createObjectURL(file);
      onChange({
        url: objectUrl,
        alt: value?.alt || file.name.replace(/\.[^/.]+$/, ''),
      });
    } finally {
      setIsLoading(false);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [accepts, value, onChange]);
  
  // Handle upload button click
  const handleUploadClick = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  
  // Handle clear image
  const handleClear = React.useCallback(() => {
    onChange(DEFAULT_IMAGE);
    setUrlInput('');
    setImageError(false);
  }, [onChange]);
  
  // Handle image load error
  const handleImageError = React.useCallback(() => {
    setImageError(true);
  }, []);
  
  // Handle image load success
  const handleImageLoad = React.useCallback(() => {
    setImageError(false);
  }, []);
  
  // Open media library dialog
  const handleMediaLibraryClick = React.useCallback(() => {
    // TODO: Open media library modal
    // This would integrate with the existing media library component
    alert('Media Library integration coming in future phase');
  }, []);

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      {/* Image Preview */}
      <div 
        className={cn(
          "relative w-full aspect-video rounded-lg border-2 border-dashed",
          "flex items-center justify-center overflow-hidden",
          "bg-muted/50 transition-colors",
          !value?.url && "hover:bg-muted hover:border-muted-foreground/50",
          disabled && "opacity-50 pointer-events-none"
        )}
      >
        {value?.url && !imageError ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.url}
              alt={value.alt || 'Preview'}
              className="w-full h-full object-contain"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
            {/* Clear button */}
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={handleClear}
            >
              <X className="h-3 w-3" />
            </Button>
          </>
        ) : imageError ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <span className="text-xs">Failed to load image</span>
            <Button variant="ghost" size="sm" onClick={handleClear}>
              Clear URL
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-xs">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
            <span className="text-xs">No image selected</span>
          </div>
        )}
      </div>
      
      {/* Tabs: URL / Upload */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-8">
          <TabsTrigger value="url" className="text-xs gap-1">
            <Link2 className="h-3 w-3" />
            URL
          </TabsTrigger>
          <TabsTrigger value="upload" className="text-xs gap-1">
            <Upload className="h-3 w-3" />
            Upload
          </TabsTrigger>
        </TabsList>
        
        {/* URL Tab */}
        <TabsContent value="url" className="mt-2">
          <Input
            value={urlInput}
            onChange={handleUrlChange}
            onBlur={handleUrlBlur}
            onKeyDown={handleUrlKeyDown}
            placeholder="https://example.com/image.jpg"
            disabled={disabled}
            className="text-sm"
          />
        </TabsContent>
        
        {/* Upload Tab */}
        <TabsContent value="upload" className="mt-2 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={accepts.join(',')}
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUploadClick}
              disabled={disabled || isLoading}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMediaLibraryClick}
              disabled={disabled}
              className="flex-1"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Media Library
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Accepts: {accepts.map(t => t.replace('image/', '')).join(', ')}
          </p>
        </TabsContent>
      </Tabs>
      
      {/* Alt Text */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Alt Text</Label>
        <Input
          value={value?.alt || ''}
          onChange={handleAltChange}
          placeholder="Describe this image"
          disabled={disabled}
          className="text-sm"
        />
      </div>
    </div>
  );
}

export default ImageFieldEditor;
