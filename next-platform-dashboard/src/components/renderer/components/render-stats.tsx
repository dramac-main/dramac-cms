"use client";

import { useEffect, useState, useRef } from "react";

interface StatItem {
  id?: string;
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

interface RenderStatsProps {
  title?: string;
  subtitle?: string;
  stats?: StatItem[];
  columns?: 2 | 3 | 4;
  style?: "default" | "bordered" | "gradient";
  animate?: boolean;
  backgroundColor?: string;
  textColor?: string;
}

// Animated counter hook for client-side rendering
function AnimatedCounter({ 
  value, 
  prefix, 
  suffix, 
  animate = true 
}: { 
  value: number; 
  prefix: string; 
  suffix: string; 
  animate?: boolean;
}) {
  const [count, setCount] = useState(() => animate ? 0 : value);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animate) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2000;
          const startTime = Date.now();
          const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * value));
            if (progress < 1) {
              requestAnimationFrame(tick);
            }
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, animate, hasAnimated]);

  return (
    <div ref={ref} className="text-4xl md:text-5xl font-bold mb-2">
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </div>
  );
}

export function RenderStats({
  title = "",
  subtitle = "",
  stats = [],
  columns = 4,
  style = "default",
  animate = true,
  backgroundColor = "#1f2937",
  textColor = "#ffffff",
}: RenderStatsProps) {

  const columnClasses = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  const styleClasses = {
    default: "",
    bordered: "border-t border-b border-white/20",
    gradient: "bg-gradient-to-r from-primary to-primary/70",
  };

  return (
    <section 
      className={`py-16 px-4 ${styleClasses[style]}`}
      style={{ 
        backgroundColor: style !== "gradient" ? backgroundColor : undefined,
        color: textColor 
      }}
    >
      <div className="max-w-6xl mx-auto">
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && <h2 className="text-3xl font-bold mb-4">{title}</h2>}
            {subtitle && <p className="opacity-80 max-w-2xl mx-auto">{subtitle}</p>}
          </div>
        )}

        <div className={`grid ${columnClasses[columns]} gap-8`}>
          {stats.map((stat, index) => (
            <div key={stat.id || index} className="text-center">
              <AnimatedCounter 
                value={stat.value} 
                prefix={stat.prefix || ""} 
                suffix={stat.suffix || ""} 
                animate={animate}
              />
              <div className="text-sm opacity-80">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
