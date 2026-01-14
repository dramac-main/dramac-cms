"use client";

import { useNode } from "@craftjs/core";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SettingsInput } from "./settings-input";
import { SettingsColor } from "./settings-color";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { TestimonialsProps, Testimonial } from "../user-components/testimonials";

export function TestimonialsSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as TestimonialsProps,
  }));

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTestimonial, setEditTestimonial] = useState<Testimonial | null>(null);

  const handleAddTestimonial = () => {
    const newTestimonial: Testimonial = {
      quote: "This is an amazing product!",
      author: "John Doe",
      role: "CEO",
      company: "Company Inc",
    };
    setProp((props: TestimonialsProps) => {
      props.testimonials = [...(props.testimonials || []), newTestimonial];
    });
  };

  const handleUpdateTestimonial = () => {
    if (editingIndex === null || !editTestimonial) return;

    setProp((props: TestimonialsProps) => {
      const testimonials = [...(props.testimonials || [])];
      testimonials[editingIndex] = editTestimonial;
      props.testimonials = testimonials;
    });
    setEditingIndex(null);
    setEditTestimonial(null);
  };

  const handleDeleteTestimonial = (index: number) => {
    setProp((props: TestimonialsProps) => {
      props.testimonials = (props.testimonials || []).filter((_, i) => i !== index);
    });
  };

  const testimonials = props.testimonials || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Header</h4>

        <SettingsInput
          label="Title"
          value={props.title || ""}
          onChange={(value) =>
            setProp((props: TestimonialsProps) => (props.title = value))
          }
          placeholder="Section title"
        />
      </div>

      <Separator />

      {/* Colors */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Colors</h4>

        <SettingsColor
          label="Background Color"
          value={props.backgroundColor || "#f8fafc"}
          onChange={(value) =>
            setProp((props: TestimonialsProps) => (props.backgroundColor = value))
          }
        />

        <SettingsColor
          label="Text Color"
          value={props.textColor || ""}
          onChange={(value) =>
            setProp((props: TestimonialsProps) => (props.textColor = value))
          }
        />
      </div>

      <Separator />

      {/* Testimonials List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Testimonials ({testimonials.length})</h4>
          <Button size="sm" variant="outline" onClick={handleAddTestimonial}>
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>

        <div className="space-y-2">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 border rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{testimonial.author}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {testimonial.quote.substring(0, 50)}...
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditingIndex(index);
                        setEditTestimonial({ ...testimonial });
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Testimonial</DialogTitle>
                    </DialogHeader>
                    {editTestimonial && (
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Quote</Label>
                          <Textarea
                            value={editTestimonial.quote}
                            onChange={(e) =>
                              setEditTestimonial({
                                ...editTestimonial,
                                quote: e.target.value,
                              })
                            }
                            rows={4}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Author Name</Label>
                          <Input
                            value={editTestimonial.author}
                            onChange={(e) =>
                              setEditTestimonial({
                                ...editTestimonial,
                                author: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Role</Label>
                            <Input
                              value={editTestimonial.role}
                              onChange={(e) =>
                                setEditTestimonial({
                                  ...editTestimonial,
                                  role: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Company</Label>
                            <Input
                              value={editTestimonial.company}
                              onChange={(e) =>
                                setEditTestimonial({
                                  ...editTestimonial,
                                  company: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <Button onClick={handleUpdateTestimonial} className="w-full">
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => handleDeleteTestimonial(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
