"use client";

import { useNode } from "@craftjs/core";
import { Plus, Minus } from "lucide-react";
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
import { useEffect, useState, useRef } from "react";

interface StatItem {
  id: string;
  value: number;
  suffix: string;
  prefix: string;
  label: string;
}

interface StatsProps {
  title: string;
  subtitle: string;
  stats: StatItem[];
  columns: 2 | 3 | 4;
  style: "default" | "bordered" | "gradient";
  animate: boolean;
  backgroundColor: string;
  textColor: string;
}

const defaultProps: StatsProps = {
  title: "",
  subtitle: "",
  stats: [
    { id: "1", value: 500, suffix: "+", prefix: "", label: "Happy Clients" },
    { id: "2", value: 1200, suffix: "", prefix: "", label: "Projects Completed" },
    { id: "3", value: 98, suffix: "%", prefix: "", label: "Client Satisfaction" },
    { id: "4", value: 15, suffix: "+", prefix: "", label: "Years Experience" },
  ],
  columns: 4,
  style: "default",
  animate: true,
  backgroundColor: "#1f2937",
  textColor: "#ffffff",
};

// Animated counter hook
function useCountUp(target: number, duration: number = 2000, animate: boolean = true) {
  const [count, setCount] = useState(() => animate ? 0 : target);
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
          const startTime = Date.now();
          const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Easing function - ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
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
  }, [target, duration, animate, hasAnimated]);

  return { count, ref };
}

function StatCounter({ stat, animate }: { stat: StatItem; animate: boolean }) {
  const { count, ref } = useCountUp(stat.value, 2000, animate);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-bold mb-2">
        {stat.prefix}
        {count.toLocaleString()}
        {stat.suffix}
      </div>
      <div className="text-sm opacity-80">{stat.label}</div>
    </div>
  );
}

export function Stats(props: Partial<StatsProps>) {
  const { title, subtitle, stats, columns, style, animate, backgroundColor, textColor } = {
    ...defaultProps,
    ...props,
  };
  
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

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
      ref={(ref) => {
        if (ref) {
          connect(drag(ref));
        }
      }}
      className={`py-16 px-4 ${styleClasses[style]} ${selected ? "ring-2 ring-primary ring-offset-2" : ""}`}
      style={{ 
        backgroundColor: style !== "gradient" ? backgroundColor : undefined,
        color: textColor,
      }}
    >
      <div className="max-w-6xl mx-auto">
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && <h2 className="text-3xl font-bold mb-4">{title}</h2>}
            {subtitle && (
              <p className="opacity-80 max-w-2xl mx-auto">{subtitle}</p>
            )}
          </div>
        )}

        <div className={`grid ${columnClasses[columns]} gap-8`}>
          {stats.map((stat) => (
            <StatCounter key={stat.id} stat={stat} animate={animate} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Settings Panel
function StatsSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as StatsProps,
  }));

  const addStat = () => {
    setProp((props: StatsProps) => {
      props.stats = [
        ...props.stats,
        {
          id: Date.now().toString(),
          value: 100,
          suffix: "",
          prefix: "",
          label: "New Stat",
        },
      ];
    });
  };

  const removeStat = (id: string) => {
    setProp((props: StatsProps) => {
      props.stats = props.stats.filter((s) => s.id !== id);
    });
  };

  const updateStat = (id: string, field: keyof StatItem, value: string | number) => {
    setProp((props: StatsProps) => {
      const stat = props.stats.find((s) => s.id === id);
      if (stat) {
        if (field === "value") {
          stat.value = parseInt(value as string) || 0;
        } else {
          (stat as unknown as Record<string, string | number>)[field] = value;
        }
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Section Title (optional)</Label>
        <Input
          value={props.title || ""}
          onChange={(e) => setProp((p: StatsProps) => (p.title = e.target.value))}
          placeholder="Our Impact"
        />
      </div>

      <div>
        <Label>Subtitle (optional)</Label>
        <Input
          value={props.subtitle || ""}
          onChange={(e) => setProp((p: StatsProps) => (p.subtitle = e.target.value))}
          placeholder="Numbers that speak for themselves"
        />
      </div>

      <div>
        <Label>Columns</Label>
        <Select
          value={props.columns?.toString() || "4"}
          onValueChange={(v) =>
            setProp((p: StatsProps) => (p.columns = parseInt(v) as 2 | 3 | 4))
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
        <Label>Style</Label>
        <Select
          value={props.style || "default"}
          onValueChange={(v) =>
            setProp((p: StatsProps) => (p.style = v as StatsProps["style"]))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="bordered">Bordered</SelectItem>
            <SelectItem value="gradient">Gradient</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Background</Label>
          <div className="flex gap-1">
            <Input
              type="color"
              value={props.backgroundColor || "#1f2937"}
              onChange={(e) =>
                setProp((p: StatsProps) => (p.backgroundColor = e.target.value))
              }
              className="w-12 h-10 p-1"
            />
            <Input
              value={props.backgroundColor || "#1f2937"}
              onChange={(e) =>
                setProp((p: StatsProps) => (p.backgroundColor = e.target.value))
              }
              className="flex-1"
            />
          </div>
        </div>
        <div>
          <Label>Text Color</Label>
          <div className="flex gap-1">
            <Input
              type="color"
              value={props.textColor || "#ffffff"}
              onChange={(e) =>
                setProp((p: StatsProps) => (p.textColor = e.target.value))
              }
              className="w-12 h-10 p-1"
            />
            <Input
              value={props.textColor || "#ffffff"}
              onChange={(e) =>
                setProp((p: StatsProps) => (p.textColor = e.target.value))
              }
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="animate"
          checked={props.animate ?? true}
          onChange={(e) =>
            setProp((p: StatsProps) => (p.animate = e.target.checked))
          }
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="animate">Animate Numbers on Scroll</Label>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Stats ({props.stats?.length || 0})</Label>
          <Button size="sm" onClick={addStat}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-3">
          {props.stats?.map((stat, index) => (
            <div key={stat.id} className="border rounded p-3 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs text-muted-foreground">
                  Stat {index + 1}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStat(stat.id)}
                  disabled={props.stats.length <= 1}
                  className="h-6 w-6 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  value={stat.prefix}
                  onChange={(e) => updateStat(stat.id, "prefix", e.target.value)}
                  placeholder="Prefix"
                />
                <Input
                  type="number"
                  value={stat.value}
                  onChange={(e) => updateStat(stat.id, "value", e.target.value)}
                  placeholder="Value"
                />
                <Input
                  value={stat.suffix}
                  onChange={(e) => updateStat(stat.id, "suffix", e.target.value)}
                  placeholder="Suffix"
                />
              </div>
              <Input
                value={stat.label}
                onChange={(e) => updateStat(stat.id, "label", e.target.value)}
                placeholder="Label"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Stats.craft = {
  props: defaultProps,
  related: {
    settings: StatsSettings,
  },
  displayName: "Stats",
};
