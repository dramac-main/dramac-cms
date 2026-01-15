"use client";

import { useNode, Element } from "@craftjs/core";
import { ReactNode } from "react";
import { Column } from "./column";
import { ColumnsSettings } from "../settings/columns-settings";

interface ColumnsProps {
  children?: ReactNode;
  columns?: 2 | 3 | 4;
  gap?: number;
  padding?: number;
}

export function Columns({
  children,
  columns = 2,
  gap = 24,
  padding = 0,
}: ColumnsProps) {
  const { connectors: { connect, drag } } = useNode();

  // Calculate responsive min width based on columns
  const minColWidth = columns >= 3 ? "250px" : "280px";

  return (
    <>
      <style>{`
        .columns-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(${minColWidth}, 1fr));
          gap: ${gap}px;
          padding: ${padding}px;
          width: 100%;
        }
        @media (min-width: 768px) {
          .columns-grid {
            grid-template-columns: repeat(${columns}, 1fr);
          }
        }
      `}</style>
      <div
        className="columns-grid"
        ref={(ref) => { if (ref) connect(drag(ref)); }}
      >
        {children || (
          <>
            {Array.from({ length: columns }).map((_, index) => (
              <Element key={index} id={`column-${index}`} is={Column} canvas />
            ))}
          </>
        )}
      </div>
    </>
  );
}

Columns.craft = {
  displayName: "Columns",
  props: {
    columns: 2,
    gap: 24,
    padding: 0,
  },
  related: {
    settings: ColumnsSettings,
  },
  rules: {
    canMoveIn: () => true,
  },
};
