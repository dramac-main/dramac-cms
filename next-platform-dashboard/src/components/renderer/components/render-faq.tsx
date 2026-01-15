"use client";

import { useState } from "react";

interface FAQItem {
  id?: string;
  question: string;
  answer: string;
}

interface FAQData {
  title: string;
  subtitle: string;
  items: FAQItem[];
  columns?: 1 | 2;
  style?: "accordion" | "cards";
  backgroundColor: string;
}

export function RenderFAQ({ props }: { props: FAQData }) {
  const { 
    title = "Frequently Asked Questions", 
    subtitle = "", 
    items = [], 
    columns = 1,
    style = "accordion",
    backgroundColor = "#f8fafc" 
  } = props || {};
  
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Split items for 2-column layout
  const firstColumn = columns === 2 ? items.slice(0, Math.ceil(items.length / 2)) : items;
  const secondColumn = columns === 2 ? items.slice(Math.ceil(items.length / 2)) : [];

  const renderAccordionItem = (item: FAQItem, index: number, globalIndex: number) => (
    <div key={item.id || globalIndex} className="border rounded-lg overflow-hidden bg-white">
      <button
        className="w-full px-6 py-4 text-left font-medium flex justify-between items-center hover:bg-gray-50 transition-colors"
        onClick={() => toggleAccordion(globalIndex)}
      >
        <span>{item.question}</span>
        <span className="text-2xl text-gray-400 transition-transform duration-200" style={{
          transform: openIndex === globalIndex ? 'rotate(45deg)' : 'none'
        }}>
          +
        </span>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ${
          openIndex === globalIndex ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className="px-6 pb-4 text-gray-600">{item.answer}</div>
      </div>
    </div>
  );

  const renderCardItem = (item: FAQItem, index: number) => (
    <div
      key={item.id || index}
      className="bg-white rounded-lg p-6 shadow-sm border"
    >
      <h3 className="font-semibold mb-2 flex items-center gap-2">
        <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {item.question}
      </h3>
      <p className="text-gray-600">{item.answer}</p>
    </div>
  );

  return (
    <section className="py-16 px-4" style={{ backgroundColor }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{title}</h2>
          {subtitle && <p className="text-gray-600 max-w-2xl mx-auto">{subtitle}</p>}
        </div>

        {style === "accordion" ? (
          columns === 1 ? (
            <div className="max-w-3xl mx-auto space-y-4">
              {items.map((item, index) => renderAccordionItem(item, index, index))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              <div className="space-y-4">
                {firstColumn.map((item, index) => renderAccordionItem(item, index, index))}
              </div>
              <div className="space-y-4">
                {secondColumn.map((item, index) => renderAccordionItem(item, index, firstColumn.length + index))}
              </div>
            </div>
          )
        ) : (
          columns === 1 ? (
            <div className="max-w-3xl mx-auto space-y-4">
              {items.map((item, index) => renderCardItem(item, index))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {items.map((item, index) => renderCardItem(item, index))}
            </div>
          )
        )}
      </div>
    </section>
  );
}
