"use client";

import { useNode } from "@craftjs/core";
import { Image as ImageIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  caption?: string;
}

interface GalleryProps {
  images: GalleryImage[];
  columns: 2 | 3 | 4;
  gap: "sm" | "md" | "lg";
  showCaptions: boolean;
  lightbox: boolean;
  borderRadius: "none" | "sm" | "md" | "lg" | "full";
}

const defaultProps: GalleryProps = {
  images: [
    { id: "1", src: "https://placehold.co/400x300", alt: "Gallery image 1" },
    { id: "2", src: "https://placehold.co/400x300", alt: "Gallery image 2" },
    { id: "3", src: "https://placehold.co/400x300", alt: "Gallery image 3" },
    { id: "4", src: "https://placehold.co/400x300", alt: "Gallery image 4" },
  ],
  columns: 3,
  gap: "md",
  showCaptions: false,
  lightbox: true,
  borderRadius: "md",
};

export function Gallery(props: Partial<GalleryProps>) {
  const { images, columns, gap, showCaptions, borderRadius, lightbox } = {
    ...defaultProps,
    ...props,
  };
  
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const gapClasses = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  };

  const columnClasses = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  const radiusClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-xl",
  };

  const handleImageClick = (src: string) => {
    if (lightbox) {
      setLightboxImage(src);
    }
  };

  return (
    <section
      ref={(ref) => {
        if (ref) {
          connect(drag(ref));
        }
      }}
      className={`py-12 px-4 ${selected ? "ring-2 ring-primary ring-offset-2" : ""}`}
    >
      <div className="max-w-6xl mx-auto">
        <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]}`}>
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group cursor-pointer overflow-hidden"
              onClick={() => handleImageClick(image.src)}
            >
              <img
                src={image.src}
                alt={image.alt}
                className={`w-full h-48 object-cover ${radiusClasses[borderRadius]} transition-transform duration-300 group-hover:scale-105`}
              />
              <div className={`absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 ${radiusClasses[borderRadius]} flex items-center justify-center`}>
                <ImageIcon className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-8 w-8" />
              </div>
              {showCaptions && image.caption && (
                <p className="mt-2 text-sm text-center text-muted-foreground">
                  {image.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="Lightbox"
            className="max-w-full max-h-full object-contain"
          />
          <button
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 transition-colors"
            onClick={() => setLightboxImage(null)}
          >
            ×
          </button>
        </div>
      )}
    </section>
  );
}

// Settings Panel
function GallerySettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as GalleryProps,
  }));

  const [newImageUrl, setNewImageUrl] = useState("");

  const addImage = () => {
    if (newImageUrl) {
      setProp((props: GalleryProps) => {
        props.images = [
          ...props.images,
          {
            id: Date.now().toString(),
            src: newImageUrl,
            alt: `Gallery image ${props.images.length + 1}`,
          },
        ];
      });
      setNewImageUrl("");
    }
  };

  const removeImage = (id: string) => {
    setProp((props: GalleryProps) => {
      props.images = props.images.filter((img) => img.id !== id);
    });
  };

  const updateImageCaption = (id: string, caption: string) => {
    setProp((props: GalleryProps) => {
      const img = props.images.find((i) => i.id === id);
      if (img) {
        img.caption = caption;
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Columns</Label>
        <Select
          value={props.columns?.toString() || "3"}
          onValueChange={(v) =>
            setProp((p: GalleryProps) => (p.columns = parseInt(v) as 2 | 3 | 4))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 Columns</SelectItem>
            <SelectItem value="3">3 Columns</SelectItem>
            <SelectItem value="4">4 Columns</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Gap</Label>
        <Select
          value={props.gap || "md"}
          onValueChange={(v) =>
            setProp((p: GalleryProps) => (p.gap = v as "sm" | "md" | "lg"))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="md">Medium</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Border Radius</Label>
        <Select
          value={props.borderRadius || "md"}
          onValueChange={(v) =>
            setProp((p: GalleryProps) => (p.borderRadius = v as GalleryProps["borderRadius"]))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="md">Medium</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
            <SelectItem value="full">Full</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="showCaptions"
          checked={props.showCaptions ?? false}
          onChange={(e) =>
            setProp((p: GalleryProps) => (p.showCaptions = e.target.checked))
          }
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="showCaptions">Show Captions</Label>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="lightbox"
          checked={props.lightbox ?? true}
          onChange={(e) =>
            setProp((p: GalleryProps) => (p.lightbox = e.target.checked))
          }
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="lightbox">Enable Lightbox</Label>
      </div>

      <div className="space-y-2">
        <Label>Add Image</Label>
        <div className="flex gap-2">
          <Input
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="Image URL"
          />
          <Button onClick={addImage} size="sm">
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Images ({props.images?.length || 0})</Label>
        <div className="max-h-60 overflow-y-auto space-y-2">
          {props.images?.map((img) => (
            <div
              key={img.id}
              className="flex items-center gap-2 p-2 bg-muted rounded"
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-12 h-12 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <Input
                  value={img.caption || ""}
                  onChange={(e) => updateImageCaption(img.id, e.target.value)}
                  placeholder="Caption (optional)"
                  className="text-xs h-7"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeImage(img.id)}
                className="h-7 w-7 p-0"
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Gallery.craft = {
  props: defaultProps,
  related: {
    settings: GallerySettings,
  },
  displayName: "Gallery",
};
