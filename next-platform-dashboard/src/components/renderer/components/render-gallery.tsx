"use client";

import { useState } from "react";

interface GalleryImage {
  id?: string;
  src: string;
  alt: string;
  caption?: string;
}

interface RenderGalleryProps {
  images?: GalleryImage[];
  columns?: 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  borderRadius?: "none" | "sm" | "md" | "lg" | "full";
  showCaptions?: boolean;
  lightbox?: boolean;
}

export function RenderGallery({
  images = [],
  columns = 3,
  gap = "md",
  borderRadius = "md",
  showCaptions = false,
  lightbox = true,
}: RenderGalleryProps) {

  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const columnClasses = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  const gapClasses = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
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
    <section className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]}`}>
          {images.map((image, index) => (
            <div 
              key={image.id || index}
              className={`overflow-hidden ${lightbox ? "cursor-pointer" : ""}`}
              onClick={() => handleImageClick(image.src)}
            >
              <img
                src={image.src}
                alt={image.alt}
                className={`w-full h-48 object-cover ${radiusClasses[borderRadius]} transition-transform duration-300 hover:scale-105`}
              />
              {showCaptions && image.caption && (
                <p className="mt-2 text-sm text-center text-gray-600">
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
