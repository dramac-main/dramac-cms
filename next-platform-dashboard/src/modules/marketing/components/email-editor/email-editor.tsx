/**
 * Visual Email Editor
 * Phase MKT-02: Email Campaign Engine (UI)
 *
 * Block-based visual email editor with drag-and-drop support,
 * live preview, and HTML output. Uses a content JSON structure
 * that maps to email-safe HTML.
 */
"use client";

import { useState, useCallback } from "react";
import {
  Type,
  Image,
  Square,
  Columns2,
  Minus,
  Link2,
  Code,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Eye,
  Code2,
  Undo2,
  Redo2,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ─── Block Types ───────────────────────────────────────────────

export type EmailBlockType =
  | "header"
  | "text"
  | "image"
  | "button"
  | "divider"
  | "spacer"
  | "columns"
  | "html";

export interface EmailBlock {
  id: string;
  type: EmailBlockType;
  content: Record<string, any>;
}

const BLOCK_TYPES: {
  type: EmailBlockType;
  label: string;
  icon: React.ElementType;
}[] = [
  { type: "header", label: "Header", icon: Type },
  { type: "text", label: "Text", icon: Type },
  { type: "image", label: "Image", icon: Image },
  { type: "button", label: "Button", icon: Square },
  { type: "divider", label: "Divider", icon: Minus },
  { type: "spacer", label: "Spacer", icon: Minus },
  { type: "columns", label: "Columns", icon: Columns2 },
  { type: "html", label: "Custom HTML", icon: Code },
];

function generateId() {
  return `block_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getDefaultContent(type: EmailBlockType): Record<string, any> {
  switch (type) {
    case "header":
      return {
        text: "Your Heading Here",
        level: "h1",
        align: "center",
        color: "#333333",
      };
    case "text":
      return {
        text: "Your text content here. Use {{first_name}} for personalization.",
        align: "left",
        color: "#555555",
        fontSize: "16",
      };
    case "image":
      return {
        src: "",
        alt: "Image",
        width: "100%",
        align: "center",
        link: "",
      };
    case "button":
      return {
        text: "Click Here",
        url: "#",
        bgColor: "#0066cc",
        textColor: "#ffffff",
        align: "center",
        borderRadius: "4",
      };
    case "divider":
      return { color: "#eeeeee", width: "100%", thickness: "1" };
    case "spacer":
      return { height: "20" };
    case "columns":
      return {
        columns: 2,
        left: "Left column content",
        right: "Right column content",
      };
    case "html":
      return { code: "<!-- Custom HTML here -->" };
    default:
      return {};
  }
}

// ─── Block to HTML Renderer ────────────────────────────────────

function blockToHtml(block: EmailBlock): string {
  const { type, content: c } = block;
  switch (type) {
    case "header":
      return `<${c.level || "h1"} style="text-align:${c.align || "center"};color:${c.color || "#333"};margin:0;padding:10px 0;">${escapeHtml(c.text || "")}</${c.level || "h1"}>`;
    case "text":
      return `<p style="text-align:${c.align || "left"};color:${c.color || "#555"};font-size:${c.fontSize || 16}px;line-height:1.6;margin:0;padding:10px 0;">${escapeHtml(c.text || "")}</p>`;
    case "image":
      return `<div style="text-align:${c.align || "center"};padding:10px 0;">${c.link ? `<a href="${escapeAttr(c.link)}">` : ""}<img src="${escapeAttr(c.src || "")}" alt="${escapeAttr(c.alt || "")}" style="max-width:${c.width || "100%"};height:auto;border:0;" />${c.link ? "</a>" : ""}</div>`;
    case "button":
      return `<div style="text-align:${c.align || "center"};padding:15px 0;"><a href="${escapeAttr(c.url || "#")}" style="display:inline-block;background-color:${c.bgColor || "#0066cc"};color:${c.textColor || "#fff"};padding:12px 24px;text-decoration:none;border-radius:${c.borderRadius || 4}px;font-weight:bold;">${escapeHtml(c.text || "Click Here")}</a></div>`;
    case "divider":
      return `<hr style="border:none;border-top:${c.thickness || 1}px solid ${c.color || "#eee"};width:${c.width || "100%"};margin:10px 0;" />`;
    case "spacer":
      return `<div style="height:${c.height || 20}px;"></div>`;
    case "columns":
      return `<table width="100%" cellpadding="0" cellspacing="0" style="padding:10px 0;"><tr><td style="width:50%;vertical-align:top;padding-right:10px;">${escapeHtml(c.left || "")}</td><td style="width:50%;vertical-align:top;padding-left:10px;">${escapeHtml(c.right || "")}</td></tr></table>`;
    case "html":
      return c.code || "";
    default:
      return "";
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function blocksToHtml(blocks: EmailBlock[]): string {
  const body = blocks.map(blockToHtml).join("\n");
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;">
<tr><td align="center" style="padding:20px 0;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;">
<tr><td style="padding:20px 30px;">
${body}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ─── Block Property Editor ─────────────────────────────────────

function BlockProperties({
  block,
  onChange,
}: {
  block: EmailBlock;
  onChange: (content: Record<string, any>) => void;
}) {
  const c = block.content;

  switch (block.type) {
    case "header":
      return (
        <div className="space-y-3">
          <div>
            <Label>Heading Text</Label>
            <Input
              value={c.text || ""}
              onChange={(e) => onChange({ ...c, text: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Level</Label>
              <Select
                value={c.level || "h1"}
                onValueChange={(v) => onChange({ ...c, level: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="h1">H1</SelectItem>
                  <SelectItem value="h2">H2</SelectItem>
                  <SelectItem value="h3">H3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Align</Label>
              <Select
                value={c.align || "center"}
                onValueChange={(v) => onChange({ ...c, align: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Color</Label>
            <Input
              type="color"
              value={c.color || "#333333"}
              onChange={(e) => onChange({ ...c, color: e.target.value })}
            />
          </div>
        </div>
      );

    case "text":
      return (
        <div className="space-y-3">
          <div>
            <Label>Text Content</Label>
            <Textarea
              value={c.text || ""}
              onChange={(e) => onChange({ ...c, text: e.target.value })}
              rows={4}
            />
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const instruction = prompt(
                    "How should the AI improve this text? (e.g., 'make it more concise', 'add urgency')",
                  );
                  if (instruction && c.text) {
                    import("../../actions/ai-marketing-actions").then(
                      async (mod) => {
                        const result = await mod.aiImproveEmailText(
                          c.text,
                          instruction,
                        );
                        if (result.success && result.data) {
                          onChange({ ...c, text: result.data });
                        }
                      },
                    );
                  }
                }}
                disabled={!c.text}
                className="text-xs"
              >
                <Sparkles className="mr-1 h-3 w-3" />
                AI Improve
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Align</Label>
              <Select
                value={c.align || "left"}
                onValueChange={(v) => onChange({ ...c, align: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Font Size</Label>
              <Input
                type="number"
                value={c.fontSize || "16"}
                onChange={(e) => onChange({ ...c, fontSize: e.target.value })}
                min={10}
                max={36}
              />
            </div>
            <div>
              <Label>Color</Label>
              <Input
                type="color"
                value={c.color || "#555555"}
                onChange={(e) => onChange({ ...c, color: e.target.value })}
              />
            </div>
          </div>
        </div>
      );

    case "image":
      return (
        <div className="space-y-3">
          <div>
            <Label>Image URL</Label>
            <Input
              value={c.src || ""}
              onChange={(e) => onChange({ ...c, src: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label>Alt Text</Label>
            <Input
              value={c.alt || ""}
              onChange={(e) => onChange({ ...c, alt: e.target.value })}
            />
          </div>
          <div>
            <Label>Link URL (optional)</Label>
            <Input
              value={c.link || ""}
              onChange={(e) => onChange({ ...c, link: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
      );

    case "button":
      return (
        <div className="space-y-3">
          <div>
            <Label>Button Text</Label>
            <Input
              value={c.text || ""}
              onChange={(e) => onChange({ ...c, text: e.target.value })}
            />
          </div>
          <div>
            <Label>URL</Label>
            <Input
              value={c.url || ""}
              onChange={(e) => onChange({ ...c, url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Background</Label>
              <Input
                type="color"
                value={c.bgColor || "#0066cc"}
                onChange={(e) => onChange({ ...c, bgColor: e.target.value })}
              />
            </div>
            <div>
              <Label>Text Color</Label>
              <Input
                type="color"
                value={c.textColor || "#ffffff"}
                onChange={(e) => onChange({ ...c, textColor: e.target.value })}
              />
            </div>
          </div>
        </div>
      );

    case "divider":
      return (
        <div className="space-y-3">
          <div>
            <Label>Color</Label>
            <Input
              type="color"
              value={c.color || "#eeeeee"}
              onChange={(e) => onChange({ ...c, color: e.target.value })}
            />
          </div>
          <div>
            <Label>Thickness (px)</Label>
            <Input
              type="number"
              value={c.thickness || "1"}
              onChange={(e) => onChange({ ...c, thickness: e.target.value })}
              min={1}
              max={10}
            />
          </div>
        </div>
      );

    case "spacer":
      return (
        <div>
          <Label>Height (px)</Label>
          <Input
            type="number"
            value={c.height || "20"}
            onChange={(e) => onChange({ ...c, height: e.target.value })}
            min={5}
            max={100}
          />
        </div>
      );

    case "columns":
      return (
        <div className="space-y-3">
          <div>
            <Label>Left Column</Label>
            <Textarea
              value={c.left || ""}
              onChange={(e) => onChange({ ...c, left: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <Label>Right Column</Label>
            <Textarea
              value={c.right || ""}
              onChange={(e) => onChange({ ...c, right: e.target.value })}
              rows={3}
            />
          </div>
        </div>
      );

    case "html":
      return (
        <div>
          <Label>Custom HTML</Label>
          <Textarea
            value={c.code || ""}
            onChange={(e) => onChange({ ...c, code: e.target.value })}
            rows={6}
            className="font-mono text-sm"
          />
        </div>
      );

    default:
      return null;
  }
}

// ─── Main Editor Component ─────────────────────────────────────

interface EmailEditorProps {
  initialBlocks?: EmailBlock[];
  onChange?: (blocks: EmailBlock[], html: string) => void;
}

export function EmailEditor({ initialBlocks, onChange }: EmailEditorProps) {
  const [blocks, setBlocks] = useState<EmailBlock[]>(initialBlocks || []);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"editor" | "preview" | "html">(
    "editor",
  );
  const [history, setHistory] = useState<EmailBlock[][]>([initialBlocks || []]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  const pushHistory = useCallback(
    (newBlocks: EmailBlock[]) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newBlocks);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex],
  );

  function updateBlocks(newBlocks: EmailBlock[]) {
    setBlocks(newBlocks);
    pushHistory(newBlocks);
    onChange?.(newBlocks, blocksToHtml(newBlocks));
  }

  function addBlock(type: EmailBlockType) {
    const newBlock: EmailBlock = {
      id: generateId(),
      type,
      content: getDefaultContent(type),
    };
    const newBlocks = [...blocks, newBlock];
    updateBlocks(newBlocks);
    setSelectedBlockId(newBlock.id);
  }

  function removeBlock(blockId: string) {
    const newBlocks = blocks.filter((b) => b.id !== blockId);
    updateBlocks(newBlocks);
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  }

  function moveBlock(blockId: string, direction: "up" | "down") {
    const idx = blocks.findIndex((b) => b.id === blockId);
    if (idx < 0) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]];
    updateBlocks(newBlocks);
  }

  function updateBlockContent(blockId: string, content: Record<string, any>) {
    const newBlocks = blocks.map((b) =>
      b.id === blockId ? { ...b, content } : b,
    );
    updateBlocks(newBlocks);
  }

  function undo() {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setBlocks(history[newIndex]);
    }
  }

  function redo() {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setBlocks(history[newIndex]);
    }
  }

  const html = blocksToHtml(blocks);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={historyIndex <= 0}
            aria-label="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            aria-label="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === "editor" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("editor")}
          >
            <Columns2 className="mr-1 h-4 w-4" />
            Editor
          </Button>
          <Button
            variant={viewMode === "preview" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("preview")}
          >
            <Eye className="mr-1 h-4 w-4" />
            Preview
          </Button>
          <Button
            variant={viewMode === "html" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("html")}
          >
            <Code2 className="mr-1 h-4 w-4" />
            HTML
          </Button>
        </div>
      </div>

      {viewMode === "editor" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Block Palette */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Add Blocks</p>
            <div className="grid grid-cols-2 gap-2">
              {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  onClick={() => addBlock(type)}
                  className="justify-start gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>

            {/* Properties Panel */}
            {selectedBlock && (
              <div className="border-t pt-3">
                <p className="text-sm font-medium mb-3">
                  Block Properties:{" "}
                  <span className="capitalize">{selectedBlock.type}</span>
                </p>
                <BlockProperties
                  block={selectedBlock}
                  onChange={(content) =>
                    updateBlockContent(selectedBlock.id, content)
                  }
                />
              </div>
            )}
          </div>

          {/* Canvas */}
          <div className="lg:col-span-2">
            <div className="border rounded-lg bg-gray-50 min-h-[400px] p-4">
              {blocks.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      Add blocks from the left panel to build your email
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {blocks.map((block, index) => (
                    <div
                      key={block.id}
                      onClick={() => setSelectedBlockId(block.id)}
                      className={`group relative p-3 rounded border bg-white cursor-pointer transition-colors ${
                        selectedBlockId === block.id
                          ? "border-primary ring-1 ring-primary/20"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {/* Block Actions */}
                      <div className="absolute -top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveBlock(block.id, "up");
                          }}
                          disabled={index === 0}
                          aria-label="Move block up"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveBlock(block.id, "down");
                          }}
                          disabled={index === blocks.length - 1}
                          aria-label="Move block down"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBlock(block.id);
                          }}
                          aria-label="Remove block"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Block Preview */}
                      <div className="text-xs text-muted-foreground mb-1 capitalize">
                        {block.type}
                      </div>
                      <iframe
                        srcDoc={blockToHtml(block)}
                        sandbox=""
                        title={`${block.type} block preview`}
                        className="w-full border-0 pointer-events-none"
                        style={{ height: "60px" }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewMode === "preview" && (
        <div className="border rounded-lg bg-gray-200 p-4">
          <div className="max-w-[600px] mx-auto bg-white rounded shadow-sm">
            <iframe
              srcDoc={html}
              sandbox=""
              title="Email preview"
              className="w-full border-0 rounded"
              style={{ minHeight: "400px" }}
            />
          </div>
        </div>
      )}

      {viewMode === "html" && (
        <Textarea
          value={html}
          readOnly
          rows={20}
          className="font-mono text-xs"
        />
      )}
    </div>
  );
}
