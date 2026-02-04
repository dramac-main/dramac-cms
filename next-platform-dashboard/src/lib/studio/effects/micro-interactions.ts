/**
 * DRAMAC Studio - Micro-interactions System
 * 
 * Delightful small animations for interactive elements.
 * 
 * @phase STUDIO-31 - 3D Effects & Advanced Animations
 */

// =============================================================================
// TYPES
// =============================================================================

export type MicroInteractionType =
  | "button-press"
  | "button-bounce"
  | "button-shine"
  | "input-focus"
  | "input-shake"
  | "toggle-flip"
  | "checkbox-check"
  | "ripple"
  | "confetti"
  | "heart-burst";

// =============================================================================
// CSS FOR MICRO-INTERACTIONS
// =============================================================================

export const MICRO_INTERACTION_CSS = `
/* Button Press */
.micro-button-press:active {
  transform: scale(0.95);
  transition: transform 0.1s ease-out;
}

/* Button Bounce */
.micro-button-bounce:hover {
  animation: micro-bounce 0.5s ease;
}

@keyframes micro-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

/* Button Shine */
.micro-button-shine {
  position: relative;
  overflow: hidden;
}
.micro-button-shine::after {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  transition: left 0.5s ease;
}
.micro-button-shine:hover::after {
  left: 100%;
}

/* Input Focus */
.micro-input-focus {
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
.micro-input-focus:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  border-color: #3b82f6;
}

/* Input Shake (for errors) */
.micro-input-shake {
  animation: micro-shake 0.5s ease;
}

@keyframes micro-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-10px); }
  40% { transform: translateX(10px); }
  60% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
}

/* Toggle Flip */
.micro-toggle-flip {
  transition: transform 0.3s ease;
}
.micro-toggle-flip.active {
  transform: rotateY(180deg);
}

/* Checkbox Check */
.micro-checkbox-check {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.micro-checkbox-check.checked {
  animation: micro-check-pop 0.3s ease;
}

@keyframes micro-check-pop {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* Ripple Effect */
.micro-ripple {
  position: relative;
  overflow: hidden;
}
.micro-ripple-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transform: scale(0);
  animation: micro-ripple 0.6s ease-out;
  pointer-events: none;
}

@keyframes micro-ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

/* Heart Burst */
.micro-heart-burst {
  animation: micro-heart 0.3s ease;
}

@keyframes micro-heart {
  0% { transform: scale(1); }
  25% { transform: scale(1.2); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}
`;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get micro-interaction class
 */
export function getMicroInteractionClass(type: MicroInteractionType): string {
  const classMap: Record<MicroInteractionType, string> = {
    "button-press": "micro-button-press",
    "button-bounce": "micro-button-bounce",
    "button-shine": "micro-button-shine",
    "input-focus": "micro-input-focus",
    "input-shake": "micro-input-shake",
    "toggle-flip": "micro-toggle-flip",
    "checkbox-check": "micro-checkbox-check",
    "ripple": "micro-ripple",
    "confetti": "", // Handled by JS
    "heart-burst": "micro-heart-burst",
  };
  
  return classMap[type] || "";
}

/**
 * Create ripple effect on element
 */
export function createRipple(e: React.MouseEvent<HTMLElement>) {
  const element = e.currentTarget;
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  
  const ripple = document.createElement("span");
  ripple.className = "micro-ripple-circle";
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
  
  element.appendChild(ripple);
  
  setTimeout(() => ripple.remove(), 600);
}

/**
 * Trigger input shake animation
 */
export function triggerShake(element: HTMLElement) {
  element.classList.add("micro-input-shake");
  setTimeout(() => element.classList.remove("micro-input-shake"), 500);
}

/**
 * Trigger heart burst animation
 */
export function triggerHeartBurst(element: HTMLElement) {
  element.classList.add("micro-heart-burst");
  setTimeout(() => element.classList.remove("micro-heart-burst"), 300);
}

// =============================================================================
// FIELD OPTIONS
// =============================================================================

/** Micro-interaction field options */
export const microInteractionFieldOptions = [
  { label: "None", value: "none" },
  { label: "─── Buttons ───", value: "", disabled: true },
  { label: "Button Press", value: "button-press" },
  { label: "Button Bounce", value: "button-bounce" },
  { label: "Button Shine", value: "button-shine" },
  { label: "─── Inputs ───", value: "", disabled: true },
  { label: "Input Focus", value: "input-focus" },
  { label: "Input Shake", value: "input-shake" },
  { label: "─── Toggles ───", value: "", disabled: true },
  { label: "Toggle Flip", value: "toggle-flip" },
  { label: "Checkbox Check", value: "checkbox-check" },
  { label: "─── Effects ───", value: "", disabled: true },
  { label: "Ripple", value: "ripple" },
  { label: "Heart Burst", value: "heart-burst" },
];
