"use client";

import { useEffect, useRef } from "react";
import { BookingWidgetBlock } from "@/modules/booking/studio/components/BookingWidgetBlock";

interface EmbedBookingClientProps {
  siteId: string;
  primaryColor?: string;
  borderRadius?: string;
  showHeader?: boolean;
  showServiceStep?: boolean;
  showStaffStep?: boolean;
  theme?: "light" | "dark" | "auto";
}

export function EmbedBookingClient({
  siteId,
  primaryColor,
  borderRadius,
  showHeader = true,
  showServiceStep = true,
  showStaffStep = true,
}: EmbedBookingClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // PostMessage bridge for parent communication (iframe resize + ready signal)
  useEffect(() => {
    try {
      window.parent.postMessage(
        {
          type: "DRAMAC_MODULE_READY",
          moduleId: "booking",
          siteId,
        },
        "*",
      );
    } catch {
      // Not in iframe or blocked by CORS — safe to ignore
    }

    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height;
      if (height) {
        try {
          window.parent.postMessage(
            {
              type: "DRAMAC_RESIZE",
              moduleId: "booking",
              height,
            },
            "*",
          );
        } catch {
          // Safe to ignore
        }
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [siteId]);

  return (
    <div
      ref={containerRef}
      style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px" }}
    >
      <BookingWidgetBlock
        siteId={siteId}
        primaryColor={primaryColor}
        borderRadius={borderRadius}
        showHeader={showHeader}
        showServiceStep={showServiceStep}
        showStaffStep={showStaffStep}
        layout="standard"
        stepIndicatorStyle="progress-bar"
        width="100%"
        padding="0"
        onComplete={(booking) => {
          try {
            window.parent.postMessage(
              {
                type: "DRAMAC_BOOKING_COMPLETE",
                moduleId: "booking",
                siteId,
                booking,
              },
              "*",
            );
          } catch {
            // Safe to ignore
          }
        }}
      />
    </div>
  );
}
