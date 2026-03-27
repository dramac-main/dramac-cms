"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Narrative lines grouped by generation stage
// ---------------------------------------------------------------------------
const NARRATIVE_GROUPS: Record<string, string[]> = {
  initializing: [
    "Initializing the design engine…",
    "Preparing your creative workspace…",
  ],
  "analyzing-prompt": [
    "Reading your description carefully…",
    "Understanding your business goals…",
    "Identifying your brand personality…",
    "Mapping out the ideal user journey…",
  ],
  "building-context": [
    "Researching your industry best practices…",
    "Analyzing successful competitor layouts…",
    "Selecting typography that matches your tone…",
  ],
  "creating-architecture": [
    "Structuring your site architecture…",
    "Planning the page flow for maximum conversion…",
    "Choosing the perfect layout for each section…",
    "Designing an intuitive navigation system…",
  ],
  "generating-pages": [
    "Crafting a captivating hero section…",
    "Writing compelling headlines and copy…",
    "Designing product showcases…",
    "Building your featured content grid…",
    "Creating an engaging about section…",
    "Styling interactive call-to-action buttons…",
    "Laying out testimonial cards…",
    "Optimizing layouts for every screen size…",
    "Refining the visual hierarchy…",
    "Adding micro-interactions and polish…",
  ],
  "generating-shared-elements": [
    "Designing a sleek navigation bar…",
    "Building the footer with all essentials…",
    "Ensuring brand consistency across pages…",
  ],
  finalizing: [
    "Running final quality checks…",
    "Polishing every pixel…",
    "Your website is almost ready…",
  ],
};

// Flatten for fallback / unknown stages
const ALL_LINES = Object.values(NARRATIVE_GROUPS).flat();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface NarrativeLine {
  id: number;
  text: string;
  status: "typing" | "highlighted" | "done";
}

interface GenerationNarrativeProps {
  isGenerating: boolean;
  stage?: string;
  progress?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function GenerationNarrative({
  isGenerating,
  stage = "",
  _progress = 0,
  className,
}: GenerationNarrativeProps) {
  const [lines, setLines] = useState<NarrativeLine[]>([]);
  const [displayText, setDisplayText] = useState("");
  const lineIdRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef(stage);
  const stageIndexRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Keep stage ref in sync
  useEffect(() => {
    if (stage !== stageRef.current) {
      stageRef.current = stage;
      stageIndexRef.current = 0;
    }
  }, [stage]);

  // Get the next line to show based on current stage
  const getNextLine = useCallback((): string => {
    const stageLines =
      NARRATIVE_GROUPS[stageRef.current] || ALL_LINES;
    const idx = stageIndexRef.current % stageLines.length;
    stageIndexRef.current += 1;
    return stageLines[idx];
  }, []);

  // Typewriter effect for a single line
  const typewriteLine = useCallback(
    (fullText: string, lineId: number) => {
      if (typingRef.current) clearTimeout(typingRef.current);
      isTypingRef.current = true;
      let charIndex = 0;

      // Add a new line entry as "typing"
      setLines((prev) => [
        ...prev.map((l) => ({
          ...l,
          status: l.status === "highlighted" ? ("done" as const) : l.status,
        })),
        { id: lineId, text: fullText, status: "typing" as const },
      ]);

      const typeChar = () => {
        charIndex++;
        setDisplayText(fullText.slice(0, charIndex));

        if (charIndex < fullText.length) {
          // Variable speed — faster for spaces, slower for punctuation
          const char = fullText[charIndex];
          const delay =
            char === " " ? 15 : char === "," || char === "." ? 80 : 25;
          typingRef.current = setTimeout(typeChar, delay);
        } else {
          // Typing complete → highlight this line
          isTypingRef.current = false;
          setLines((prev) =>
            prev.map((l) =>
              l.id === lineId ? { ...l, status: "highlighted" as const } : l
            )
          );
        }
      };

      typeChar();
    },
    []
  );

  // Main interval: queue a new line periodically
  useEffect(() => {
    if (!isGenerating) {
      // Reset on stop
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (typingRef.current) clearTimeout(typingRef.current);
      setLines([]);
      setDisplayText("");
      lineIdRef.current = 0;
      stageIndexRef.current = 0;
      isTypingRef.current = false;
      return;
    }

    // Kick off the first line immediately
    const firstLine = getNextLine();
    lineIdRef.current += 1;
    typewriteLine(firstLine, lineIdRef.current);

    // Then add new lines every 3-5s
    intervalRef.current = setInterval(() => {
      if (isTypingRef.current) return; // wait for current typewriter to finish
      const nextLine = getNextLine();
      lineIdRef.current += 1;
      typewriteLine(nextLine, lineIdRef.current);
    }, 3500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (typingRef.current) clearTimeout(typingRef.current);
    };
  }, [isGenerating, getNextLine, typewriteLine]);

  // Auto-scroll to bottom when lines change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [lines, displayText]);

  if (!isGenerating && lines.length === 0) return null;

  // Find the currently-typing line
  const _typingLine = lines.find((l) => l.status === "typing");

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Gradient fade at top */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-linear-to-b from-background/80 to-transparent z-10 pointer-events-none" />

      {/* Lines container */}
      <div
        ref={scrollRef}
        className="relative max-h-50 overflow-y-auto scrollbar-hide px-1 pt-8 pb-2 space-y-1"
      >
        <AnimatePresence initial={false}>
          {lines.map((line) => {
            const isActive = line.status === "highlighted" || line.status === "typing";
            const isDone = line.status === "done";

            return (
              <motion.div
                key={line.id}
                initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
                animate={{
                  opacity: isDone ? 0.4 : 1,
                  y: 0,
                  filter: "blur(0px)",
                }}
                transition={{
                  duration: 0.4,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="relative"
              >
                <p
                  className={cn(
                    "text-sm leading-relaxed transition-all duration-500 font-medium",
                    isActive && "text-foreground",
                    isDone && "text-muted-foreground/50"
                  )}
                >
                  {/* Show typewriter text for the actively typing line */}
                  {line.status === "typing" ? (
                    <span>
                      {displayText}
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          repeatType: "reverse",
                        }}
                        className="inline-block w-0.5 h-4 ml-0.5 bg-primary align-text-bottom"
                      />
                    </span>
                  ) : (
                    line.text
                  )}
                </p>

                {/* Glow underline for highlighted line */}
                {line.status === "highlighted" && (
                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    exit={{ scaleX: 0, opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute -bottom-0.5 left-0 right-0 h-0.5 origin-left"
                    style={{
                      background:
                        "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.3) 100%)",
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Gradient fade at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-linear-to-t from-background/80 to-transparent z-10 pointer-events-none" />

      {/* Ambient glow behind the narrative */}
      <motion.div
        animate={{
          opacity: [0.15, 0.3, 0.15],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 -z-10 rounded-xl pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 80%, hsl(var(--primary) / 0.12) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
