import { cn } from "@/lib/utils";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  avatar?: string;
}

interface RenderTestimonialsProps {
  title?: string;
  testimonials: Testimonial[];
  backgroundColor?: string;
  className?: string;
}

export function RenderTestimonials({
  title,
  testimonials = [],
  backgroundColor = "transparent",
  className,
}: RenderTestimonialsProps) {
  return (
    <section
      className={cn("px-6 py-16", className)}
      style={{ backgroundColor }}
    >
      <div className="max-w-6xl mx-auto">
        {title && (
          <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-6 rounded-lg border bg-card"
            >
              <blockquote className="text-lg mb-4">
                "{testimonial.quote}"
              </blockquote>
              <div className="flex items-center gap-3">
                {testimonial.avatar ? (
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-lg font-semibold">
                      {testimonial.author[0]}
                    </span>
                  </div>
                )}
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
