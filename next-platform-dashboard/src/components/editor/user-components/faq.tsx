"use client";

import { useNode } from "@craftjs/core";
import { HelpCircle, Plus, Minus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQProps {
  title: string;
  subtitle: string;
  items: FAQItem[];
  columns: 1 | 2;
  style: "accordion" | "cards";
  backgroundColor: string;
}

const defaultProps: FAQProps = {
  title: "Frequently Asked Questions",
  subtitle: "Find answers to common questions about our services",
  items: [
    {
      id: "1",
      question: "What services do you offer?",
      answer: "We offer a comprehensive range of services including web design, development, SEO optimization, and digital marketing solutions tailored to your business needs.",
    },
    {
      id: "2",
      question: "How long does a typical project take?",
      answer: "Project timelines vary based on complexity. A simple website typically takes 2-4 weeks, while more complex projects may take 2-3 months. We'll provide a detailed timeline during our initial consultation.",
    },
    {
      id: "3",
      question: "Do you offer ongoing support?",
      answer: "Yes! We offer various support and maintenance packages to ensure your website stays updated, secure, and performing optimally after launch.",
    },
    {
      id: "4",
      question: "What is your pricing structure?",
      answer: "Our pricing is project-based and depends on your specific requirements. We offer transparent quotes with no hidden fees. Contact us for a free consultation and custom quote.",
    },
  ],
  columns: 1,
  style: "accordion",
  backgroundColor: "#f8fafc",
};

export function FAQ(props: Partial<FAQProps>) {
  const { title, subtitle, items, columns, style, backgroundColor } = {
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
    1: "max-w-3xl",
    2: "grid md:grid-cols-2 gap-6 max-w-5xl",
  };

  return (
    <section
      ref={(ref) => {
        if (ref) {
          connect(drag(ref));
        }
      }}
      className={`py-16 px-4 ${selected ? "ring-2 ring-primary ring-offset-2" : ""}`}
      style={{ backgroundColor }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {style === "accordion" ? (
          <div className={`mx-auto ${columnClasses[columns]}`}>
            {columns === 1 ? (
              <Accordion type="single" collapsible className="w-full">
                {items.map((item) => (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger className="text-left">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent>{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <>
                <div className="space-y-4">
                  {items.slice(0, Math.ceil(items.length / 2)).map((item) => (
                    <Accordion key={item.id} type="single" collapsible>
                      <AccordionItem value={item.id}>
                        <AccordionTrigger className="text-left">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent>{item.answer}</AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ))}
                </div>
                <div className="space-y-4">
                  {items.slice(Math.ceil(items.length / 2)).map((item) => (
                    <Accordion key={item.id} type="single" collapsible>
                      <AccordionItem value={item.id}>
                        <AccordionTrigger className="text-left">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent>{item.answer}</AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className={`mx-auto ${columnClasses[columns]}`}>
            {columns === 1 ? (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg p-6 shadow-sm border"
                  >
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      {item.question}
                    </h3>
                    <p className="text-muted-foreground">{item.answer}</p>
                  </div>
                ))}
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg p-6 shadow-sm border"
                >
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    {item.question}
                  </h3>
                  <p className="text-muted-foreground">{item.answer}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// Settings Panel
function FAQSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as FAQProps,
  }));

  const addItem = () => {
    setProp((props: FAQProps) => {
      props.items = [
        ...props.items,
        {
          id: Date.now().toString(),
          question: "New question?",
          answer: "Add your answer here...",
        },
      ];
    });
  };

  const removeItem = (id: string) => {
    setProp((props: FAQProps) => {
      props.items = props.items.filter((item) => item.id !== id);
    });
  };

  const updateItem = (id: string, field: "question" | "answer", value: string) => {
    setProp((props: FAQProps) => {
      const item = props.items.find((i) => i.id === id);
      if (item) {
        item[field] = value;
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Section Title</Label>
        <Input
          value={props.title || ""}
          onChange={(e) => setProp((p: FAQProps) => (p.title = e.target.value))}
        />
      </div>

      <div>
        <Label>Subtitle</Label>
        <Textarea
          value={props.subtitle || ""}
          onChange={(e) => setProp((p: FAQProps) => (p.subtitle = e.target.value))}
          rows={2}
        />
      </div>

      <div>
        <Label>Style</Label>
        <div className="flex gap-2">
          {(["accordion", "cards"] as const).map((style) => (
            <Button
              key={style}
              variant={props.style === style ? "default" : "outline"}
              size="sm"
              onClick={() => setProp((p: FAQProps) => (p.style = style))}
            >
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label>Columns</Label>
        <div className="flex gap-2">
          {([1, 2] as const).map((col) => (
            <Button
              key={col}
              variant={props.columns === col ? "default" : "outline"}
              size="sm"
              onClick={() => setProp((p: FAQProps) => (p.columns = col))}
            >
              {col} Column{col > 1 ? "s" : ""}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label>Background Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={props.backgroundColor || "#f8fafc"}
            onChange={(e) =>
              setProp((p: FAQProps) => (p.backgroundColor = e.target.value))
            }
            className="w-16 h-10 p-1"
          />
          <Input
            value={props.backgroundColor || "#f8fafc"}
            onChange={(e) =>
              setProp((p: FAQProps) => (p.backgroundColor = e.target.value))
            }
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>FAQ Items ({props.items?.length || 0})</Label>
          <Button size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2">
          {props.items?.map((item, index) => (
            <div key={item.id} className="border rounded p-3 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs text-muted-foreground">
                  FAQ {index + 1}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  className="h-6 w-6 p-0"
                  disabled={props.items.length <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={item.question}
                onChange={(e) => updateItem(item.id, "question", e.target.value)}
                placeholder="Question"
              />
              <Textarea
                value={item.answer}
                onChange={(e) => updateItem(item.id, "answer", e.target.value)}
                placeholder="Answer"
                rows={2}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

FAQ.craft = {
  props: defaultProps,
  related: {
    settings: FAQSettings,
  },
  displayName: "FAQ",
};
