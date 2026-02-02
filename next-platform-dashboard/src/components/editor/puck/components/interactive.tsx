/**
 * Puck Interactive Components (PHASE-ED-03A)
 * 
 * Interactive and animated components for engaging user experiences.
 * Includes carousels, sliders, lightboxes, parallax effects, and more.
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";
import type {
  CarouselProps,
  SliderProps,
  LightboxProps,
  ParallaxProps,
  RevealProps,
  TypewriterProps,
  VideoBackgroundProps,
  CountdownProps,
  ConfettiProps,
  AnimatedGradientProps,
} from "@/types/puck";

// ImageValue type for Wave 3 advanced field system
type ImageValue = {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};

// Helper to extract URL from string or ImageValue object
function extractImageUrl(src: string | ImageValue | undefined): string {
  if (!src) return "";
  if (typeof src === "string") return src;
  if (typeof src === "object" && "url" in src) return src.url || "";
  return "";
}

// ============================================
// CAROUSEL COMPONENT
// ============================================

export function CarouselRender({
  slides = [],
  autoplay = false,
  autoplayInterval = 5000,
  showNavigation = true,
  showPagination = true,
  loop = true,
  slideHeight = 400,
  gap = "md",
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const gapMap: Record<string, string> = {
    none: "gap-0",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-8",
  };

  const totalSlides = slides.length || 0;

  const goToSlide = useCallback((index: number) => {
    if (loop) {
      setCurrentIndex((index + totalSlides) % totalSlides);
    } else {
      setCurrentIndex(Math.max(0, Math.min(index, totalSlides - 1)));
    }
  }, [loop, totalSlides]);

  const goNext = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  const goPrev = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  useEffect(() => {
    if (autoplay && !isPaused && totalSlides > 1) {
      intervalRef.current = setInterval(goNext, autoplayInterval);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoplay, isPaused, autoplayInterval, goNext, totalSlides]);

  if (totalSlides === 0) {
    return (
      <div
        className="flex items-center justify-center bg-muted rounded-lg"
        style={{ height: slideHeight }}
      >
        <p className="text-muted-foreground">Add slides to the carousel</p>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-lg"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides Container */}
      <div
        className={cn("flex transition-transform duration-500 ease-out", gapMap[gap || "md"])}
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
          height: slideHeight,
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className="min-w-full relative"
            style={{ height: slideHeight }}
          >
            {slide.image && (
              <img
                src={slide.image}
                alt={slide.title || `Slide ${index + 1}`}
                className="w-full h-full object-cover"
              />
            )}
            {(slide.title || slide.description) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white p-6 text-center">
                {slide.title && (
                  <h3 className="text-2xl md:text-4xl font-bold mb-2">{slide.title}</h3>
                )}
                {slide.description && (
                  <p className="text-lg opacity-90 max-w-xl">{slide.description}</p>
                )}
                {slide.buttonText && (
                  <a
                    href={slide.buttonLink || "#"}
                    className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    {slide.buttonText}
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {showNavigation && totalSlides > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {showPagination && totalSlides > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-3 h-3 rounded-full transition-colors",
                index === currentIndex ? "bg-white" : "bg-white/50 hover:bg-white/75"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// SLIDER COMPONENT (Testimonial/Content Slider)
// ============================================

export function SliderRender({
  items = [],
  variant = "default",
  autoplay = false,
  autoplayInterval = 4000,
  showArrows = true,
  showDots = true,
  slidesToShow = 1,
}: SliderProps) {
  const [current, setCurrent] = useState(0);
  const total = items.length || 0;

  useEffect(() => {
    if (autoplay && total > slidesToShow) {
      const interval = setInterval(() => {
        setCurrent((prev) => (prev + 1) % Math.max(1, total - slidesToShow + 1));
      }, autoplayInterval);
      return () => clearInterval(interval);
    }
  }, [autoplay, autoplayInterval, total, slidesToShow]);

  if (total === 0) {
    return (
      <div className="p-8 text-center bg-muted rounded-lg">
        <p className="text-muted-foreground">Add items to the slider</p>
      </div>
    );
  }

  const variantStyles: Record<string, string> = {
    default: "bg-card border rounded-lg p-6",
    cards: "bg-card border rounded-xl p-8 shadow-lg",
    minimal: "p-6",
  };

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500"
          style={{ transform: `translateX(-${current * (100 / slidesToShow)}%)` }}
        >
          {items.map((item, index) => (
            <div
              key={index}
              className="px-2"
              style={{ minWidth: `${100 / slidesToShow}%` }}
            >
              <div className={cn(variantStyles[variant || "default"])}>
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.title || ""}
                    className="w-16 h-16 rounded-full mx-auto mb-4 object-cover"
                  />
                )}
                {item.content && (
                  <p className="text-lg italic mb-4">&ldquo;{item.content}&rdquo;</p>
                )}
                {item.title && (
                  <h4 className="font-semibold">{item.title}</h4>
                )}
                {item.subtitle && (
                  <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showArrows && total > slidesToShow && (
        <>
          <button
            onClick={() => setCurrent(Math.max(0, current - 1))}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 p-2 rounded-full bg-background border shadow-md hover:bg-muted transition-colors"
            disabled={current === 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrent(Math.min(total - slidesToShow, current + 1))}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 p-2 rounded-full bg-background border shadow-md hover:bg-muted transition-colors"
            disabled={current >= total - slidesToShow}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {showDots && total > slidesToShow && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: total - slidesToShow + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-colors",
                index === current ? "bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// LIGHTBOX COMPONENT
// ============================================

export function LightboxRender({
  images = [],
  columns = 3,
  gap = "md",
  aspectRatio = "square",
  showCaptions = true,
}: LightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  const gapMap: Record<string, string> = {
    none: "gap-0",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  };

  const aspectRatioMap: Record<string, string> = {
    square: "aspect-square",
    landscape: "aspect-video",
    portrait: "aspect-[3/4]",
    auto: "",
  };

  const columnMap: Record<number, string> = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  const openLightbox = (index: number) => {
    setCurrentImage(index);
    setIsOpen(true);
  };

  const closeLightbox = () => setIsOpen(false);

  const goNext = () => setCurrentImage((prev) => (prev + 1) % images.length);
  const goPrev = () => setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

  if (images.length === 0) {
    return (
      <div className="p-8 text-center bg-muted rounded-lg">
        <ZoomIn className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-muted-foreground">Add images to create a lightbox gallery</p>
      </div>
    );
  }

  return (
    <>
      {/* Thumbnail Grid */}
      <div className={cn("grid", columnMap[columns || 3], gapMap[gap || "md"])}>
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => openLightbox(index)}
            className={cn(
              "relative overflow-hidden rounded-lg group cursor-pointer",
              aspectRatioMap[aspectRatio || "square"]
            )}
          >
            <img
              src={image.src}
              alt={image.alt || `Image ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {showCaptions && image.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-white text-sm truncate">{image.caption}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <div onClick={(e) => e.stopPropagation()} className="max-w-5xl max-h-[90vh] p-4">
            <img
              src={images[currentImage]?.src}
              alt={images[currentImage]?.alt || ""}
              className="max-w-full max-h-[80vh] object-contain mx-auto"
            />
            {showCaptions && images[currentImage]?.caption && (
              <p className="text-white text-center mt-4">{images[currentImage].caption}</p>
            )}
            <p className="text-white/60 text-center mt-2">
              {currentImage + 1} / {images.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================
// PARALLAX COMPONENT
// ============================================

export function ParallaxRender({
  backgroundImage,
  backgroundColor = "#1a1a2e",
  speed = 0.5,
  minHeight = 400,
  overlay = true,
  overlayOpacity = 50,
  alignment = "center",
}: ParallaxProps) {
  const [offset, setOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Extract URL from ImageValue or string
  const bgImageUrl = extractImageUrl(backgroundImage);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const scrolled = window.scrollY;
        const rate = scrolled * speed;
        setOffset(rate);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  const alignmentMap: Record<string, string> = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden flex flex-col justify-center px-8", alignmentMap[alignment || "center"])}
      style={{ minHeight }}
    >
      {/* Parallax Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: bgImageUrl ? `url(${bgImageUrl})` : undefined,
          backgroundColor: !bgImageUrl ? backgroundColor : undefined,
          transform: `translateY(${offset}px)`,
          height: `calc(100% + ${Math.abs(offset) * 2}px)`,
          top: `-${Math.abs(offset)}px`,
        }}
      />

      {/* Overlay */}
      {overlay && bgImageUrl && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity / 100 }}
        />
      )}

      {/* Content Slot */}
      <div className="relative z-10 max-w-4xl mx-auto text-white">
        <p className="text-muted-foreground text-center">[Parallax content slot]</p>
      </div>
    </div>
  );
}

// ============================================
// REVEAL COMPONENT (Scroll Animation)
// ============================================

export function RevealRender({
  animation = "fade-up",
  duration = 600,
  delay = 0,
  threshold = 0.1,
  once = true,
}: RevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, once]);

  const animationStyles: Record<string, { initial: React.CSSProperties; visible: React.CSSProperties }> = {
    "fade-up": {
      initial: { opacity: 0, transform: "translateY(40px)" },
      visible: { opacity: 1, transform: "translateY(0)" },
    },
    "fade-down": {
      initial: { opacity: 0, transform: "translateY(-40px)" },
      visible: { opacity: 1, transform: "translateY(0)" },
    },
    "fade-left": {
      initial: { opacity: 0, transform: "translateX(40px)" },
      visible: { opacity: 1, transform: "translateX(0)" },
    },
    "fade-right": {
      initial: { opacity: 0, transform: "translateX(-40px)" },
      visible: { opacity: 1, transform: "translateX(0)" },
    },
    "zoom-in": {
      initial: { opacity: 0, transform: "scale(0.8)" },
      visible: { opacity: 1, transform: "scale(1)" },
    },
    "zoom-out": {
      initial: { opacity: 0, transform: "scale(1.2)" },
      visible: { opacity: 1, transform: "scale(1)" },
    },
    "flip-up": {
      initial: { opacity: 0, transform: "rotateX(90deg)" },
      visible: { opacity: 1, transform: "rotateX(0)" },
    },
    "flip-left": {
      initial: { opacity: 0, transform: "rotateY(90deg)" },
      visible: { opacity: 1, transform: "rotateY(0)" },
    },
  };

  const styles = animationStyles[animation || "fade-up"] || animationStyles["fade-up"];

  return (
    <div
      ref={ref}
      style={{
        ...(isVisible ? styles.visible : styles.initial),
        transition: `all ${duration}ms ease-out ${delay}ms`,
      }}
    >
      <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
        [Reveal content slot - Animation: {animation}]
      </div>
    </div>
  );
}

// ============================================
// TYPEWRITER COMPONENT
// ============================================

export function TypewriterRender({
  texts = [],
  speed = 100,
  deleteSpeed = 50,
  delayBetween = 2000,
  loop = true,
  cursor = true,
  cursorChar = "|",
  className = "",
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (texts.length === 0) return;

    const currentFullText = texts[textIndex] || "";
    let timeout: NodeJS.Timeout;

    if (!isDeleting) {
      // Typing
      if (displayText.length < currentFullText.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentFullText.slice(0, displayText.length + 1));
        }, speed);
      } else {
        // Finished typing, wait then start deleting
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, delayBetween);
      }
    } else {
      // Deleting
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, deleteSpeed);
      } else {
        // Finished deleting, move to next text
        setIsDeleting(false);
        if (loop) {
          setTextIndex((prev) => (prev + 1) % texts.length);
        } else if (textIndex < texts.length - 1) {
          setTextIndex((prev) => prev + 1);
        }
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, textIndex, texts, speed, deleteSpeed, delayBetween, loop]);

  if (texts.length === 0) {
    return (
      <span className="text-muted-foreground">Add texts to typewriter</span>
    );
  }

  return (
    <span className={cn("inline", className)}>
      {displayText}
      {cursor && (
        <span className="animate-pulse">{cursorChar}</span>
      )}
    </span>
  );
}

// ============================================
// VIDEO BACKGROUND COMPONENT
// ============================================

export function VideoBackgroundRender({
  videoUrl,
  posterImage,
  overlay = true,
  overlayOpacity = 50,
  overlayColor = "#000000",
  minHeight = 500,
  muted = true,
  autoplay = true,
  loop = true,
}: VideoBackgroundProps) {
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isMuted, setIsMuted] = useState(muted);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="relative overflow-hidden" style={{ minHeight }}>
      {/* Video Background */}
      {videoUrl ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          poster={posterImage}
          autoPlay={autoplay}
          muted={muted}
          loop={loop}
          playsInline
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: posterImage ? `url(${posterImage})` : undefined, backgroundColor: "#1a1a2e" }}
        />
      )}

      {/* Overlay */}
      {overlay && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: overlayColor,
            opacity: overlayOpacity / 100,
          }}
        />
      )}

      {/* Content Slot */}
      <div className="relative z-10 flex flex-col items-center justify-center text-white text-center p-8" style={{ minHeight }}>
        <p className="text-white/60">[Video background content slot]</p>
      </div>

      {/* Video Controls */}
      {videoUrl && (
        <div className="absolute bottom-4 right-4 flex gap-2 z-20">
          <button
            onClick={togglePlay}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleMute}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// COUNTDOWN COMPONENT
// ============================================

export function CountdownRender({
  targetDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  showDays = true,
  showHours = true,
  showMinutes = true,
  showSeconds = true,
  variant = "default",
  size = "md",
  labels = { days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds" },
  completedMessage = "Event has started!",
}: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const calculateTimeLeft = () => {
      const now = Date.now();
      const difference = target - now;

      if (difference <= 0) {
        setIsComplete(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (isComplete) {
    return (
      <div className="text-center p-8">
        <p className="text-xl font-semibold text-primary">{completedMessage}</p>
      </div>
    );
  }

  const sizeMap: Record<string, { number: string; label: string }> = {
    sm: { number: "text-2xl", label: "text-xs" },
    md: { number: "text-4xl", label: "text-sm" },
    lg: { number: "text-6xl", label: "text-base" },
  };

  const variantStyles: Record<string, string> = {
    default: "bg-card border",
    minimal: "",
    boxed: "bg-primary/10 border-primary",
  };

  const TimeUnit = ({ value, label: unitLabel }: { value: number; label: string }) => (
    <div className={cn("flex flex-col items-center p-4 rounded-lg", variantStyles[variant || "default"])}>
      <span className={cn("font-bold tabular-nums", sizeMap[size || "md"].number)}>
        {String(value).padStart(2, "0")}
      </span>
      <span className={cn("text-muted-foreground uppercase tracking-wide", sizeMap[size || "md"].label)}>
        {unitLabel}
      </span>
    </div>
  );

  return (
    <div className="flex gap-4 justify-center flex-wrap">
      {showDays && <TimeUnit value={timeLeft.days} label={labels?.days || "Days"} />}
      {showHours && <TimeUnit value={timeLeft.hours} label={labels?.hours || "Hours"} />}
      {showMinutes && <TimeUnit value={timeLeft.minutes} label={labels?.minutes || "Minutes"} />}
      {showSeconds && <TimeUnit value={timeLeft.seconds} label={labels?.seconds || "Seconds"} />}
    </div>
  );
}

// ============================================
// CONFETTI COMPONENT
// ============================================

export function ConfettiRender({
  trigger = "load",
  colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"],
  particleCount = 100,
  spread = 70,
  duration = 3000,
}: ConfettiProps) {
  const [isActive, setIsActive] = useState(trigger === "load");
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    color: string;
    delay: number;
    rotation: number;
    size: number;
  }>>([]);

  const createParticles = useCallback(() => {
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * spread - spread / 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 1000,
      rotation: Math.random() * 360,
      size: Math.random() * 8 + 4,
    }));
    setParticles(newParticles);
    setIsActive(true);

    setTimeout(() => setIsActive(false), duration);
  }, [colors, particleCount, spread, duration]);

  useEffect(() => {
    if (trigger === "load") {
      createParticles();
    }
  }, [trigger, createParticles]);

  if (!isActive) {
    return (
      <button
        onClick={createParticles}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        🎉 Trigger Confetti
      </button>
    );
  }

  return (
    <div className="relative overflow-hidden h-64 flex items-center justify-center">
      <p className="text-2xl font-bold">🎉</p>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-confetti"
          style={{
            left: `calc(50% + ${particle.x}px)`,
            backgroundColor: particle.color,
            width: particle.size,
            height: particle.size,
            animationDelay: `${particle.delay}ms`,
            transform: `rotate(${particle.rotation}deg)`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            top: -10%;
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
            transform: rotate(720deg) translateX(20px);
          }
        }
        .animate-confetti {
          animation: confetti-fall 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// ============================================
// ANIMATED GRADIENT COMPONENT
// ============================================

export function AnimatedGradientRender({
  colors = ["#667eea", "#764ba2", "#f093fb", "#f5576c"],
  angle = 45,
  speed = 5,
  minHeight = 300,
  blur = 0,
}: AnimatedGradientProps) {
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition((prev) => (prev + 1) % 100);
    }, 50 / speed);
    return () => clearInterval(interval);
  }, [speed]);

  const colorStops = colors
    .map((color, i) => `${color} ${(i * 100) / (colors.length - 1)}%`)
    .join(", ");

  return (
    <div
      className="relative overflow-hidden flex items-center justify-center rounded-lg"
      style={{
        minHeight,
        background: `linear-gradient(${angle}deg, ${colorStops})`,
        backgroundSize: "200% 200%",
        backgroundPosition: `${position}% ${position}%`,
        transition: "background-position 0.05s linear",
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
      }}
    >
      <div className="relative z-10 text-white text-center p-8">
        <p className="text-white/80">[Animated gradient content slot]</p>
      </div>
    </div>
  );
}
