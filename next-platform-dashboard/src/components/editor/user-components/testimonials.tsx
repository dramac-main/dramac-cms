"use client";

import { useNode } from "@craftjs/core";
import { cn } from "@/lib/utils";
import { Quote } from "lucide-react";

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar?: string;
}

export interface TestimonialsProps {
  title?: string;
  layout?: "grid" | "carousel";
  testimonials?: Testimonial[];
  backgroundColor?: string;
  textColor?: string;
}

const defaultTestimonials: Testimonial[] = [
  {
    quote: "This platform transformed how we build websites. Absolutely incredible!",
    author: "Sarah Johnson",
    role: "CEO",
    company: "TechCorp",
  },
  {
    quote: "The AI features saved us countless hours. Best investment we made.",
    author: "Mike Chen",
    role: "Marketing Director",
    company: "GrowthLabs",
  },
  {
    quote: "Simple, powerful, and beautiful. Everything we needed in one place.",
    author: "Emily Davis",
    role: "Designer",
    company: "Creative Studio",
  },
];

export function Testimonials({
  title = "What Our Clients Say",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  layout = "grid",
  testimonials = defaultTestimonials,
  backgroundColor = "#f8fafc",
  textColor = "",
}: TestimonialsProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <section
      ref={(ref) => {
        if (ref) {
          connect(drag(ref));
        }
      }}
      className="py-16 px-8"
      style={{ backgroundColor, color: textColor }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
        </div>

        {/* Testimonials Grid */}
        <div className={cn("grid gap-8 md:grid-cols-3")}>
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <Quote className="w-8 h-8 text-primary/30 mb-4" />
              <p className="text-lg mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-medium">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm opacity-60">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

Testimonials.craft = {
  displayName: "Testimonials",
  props: {
    title: "What Our Clients Say",
    layout: "grid",
    testimonials: defaultTestimonials,
    backgroundColor: "#f8fafc",
    textColor: "",
  },
  related: {
    // toolbar: () => import("../settings/testimonials-settings").then((m) => m.TestimonialsSettings),
  },
  rules: {
    canDrag: () => true,
  },
};
