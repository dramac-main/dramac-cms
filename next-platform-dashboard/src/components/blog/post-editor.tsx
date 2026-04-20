"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import CharacterCount from "@tiptap/extension-character-count";
import Typography from "@tiptap/extension-typography";
import { common, createLowlight } from "lowlight";
import { useCallback, useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Image as ImageIcon,
  Link as LinkIcon,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Minus,
  Upload,
  FolderOpen,
  Youtube,
  Highlighter,
  Palette,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Table as TableIcon,
  TableCellsMerge,
  Trash2,
  Plus,
  RemoveFormatting,
  Type,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MediaPickerDialog } from "@/components/media/media-picker-dialog";
import type { MediaFile } from "@/lib/media/media-service";

const lowlight = createLowlight(common);

const FONT_SIZES = [
  { label: "Small", value: "14px" },
  { label: "Normal", value: "" },
  { label: "Large", value: "20px" },
  { label: "Extra Large", value: "24px" },
  { label: "Huge", value: "32px" },
];

const TEXT_COLORS = [
  { label: "Default", value: "" },
  { label: "Red", value: "#dc2626" },
  { label: "Orange", value: "#ea580c" },
  { label: "Yellow", value: "#ca8a04" },
  { label: "Green", value: "#16a34a" },
  { label: "Blue", value: "#2563eb" },
  { label: "Purple", value: "#9333ea" },
  { label: "Pink", value: "#db2777" },
  { label: "Gray", value: "#6b7280" },
];

const HIGHLIGHT_COLORS = [
  { label: "Yellow", value: "#fef08a" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Blue", value: "#bfdbfe" },
  { label: "Pink", value: "#fbcfe8" },
  { label: "Orange", value: "#fed7aa" },
  { label: "Purple", value: "#e9d5ff" },
];

interface PostEditorProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>, html: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  agencyId?: string;
  siteId?: string;
}

export function PostEditor({
  content,
  onChange,
  placeholder = "Start writing your post...",
  className,
  disabled = false,
  agencyId,
  siteId,
}: PostEditorProps) {
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showEmbedDialog, setShowEmbedDialog] = useState(false);
  const [embedUrl, setEmbedUrl] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: "bg-muted rounded-lg p-4 my-4 overflow-x-auto text-sm font-mono",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg my-4",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline hover:no-underline",
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      Color,
      Underline,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse table-auto w-full my-4",
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      CharacterCount,
      Typography,
    ],
    content: content as Parameters<typeof useEditor>[0]["content"],
    editable: !disabled,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm sm:prose lg:prose-lg dark:prose-invert",
          "focus:outline-none min-h-[400px] max-w-none p-4",
          "[&_.is-editor-empty:first-child::before]:text-muted-foreground",
          "[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          "[&_.is-editor-empty:first-child::before]:float-left",
          "[&_.is-editor-empty:first-child::before]:h-0",
          "[&_.is-editor-empty:first-child::before]:pointer-events-none",
          "[&_table]:border-collapse [&_table]:w-full [&_table]:my-4",
          "[&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted [&_th]:font-semibold [&_th]:text-left",
          "[&_td]:border [&_td]:border-border [&_td]:p-2",
          "[&_tr]:border-b [&_tr]:border-border",
          "[&_mark]:rounded [&_mark]:px-0.5",
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON(), editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content && Object.keys(content).length > 0) {
      const currentContent = editor.getJSON();
      if (JSON.stringify(currentContent) !== JSON.stringify(content)) {
        editor.commands.setContent(
          content as Parameters<typeof editor.commands.setContent>[0],
        );
      }
    }
  }, [content, editor]);

  const addImage = useCallback(() => {
    setImageUrl("");
    setImageAlt("");
    setShowImageDialog(true);
  }, []);

  const addLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    setLinkUrl(previousUrl || "");
    setShowLinkDialog(true);
  }, [editor]);

  const removeLink = useCallback(() => {
    if (editor) editor.chain().focus().unsetLink().run();
  }, [editor]);

  const insertEmbed = useCallback(() => {
    if (!embedUrl || !editor) return;
    let src = embedUrl;
    const ytMatch = embedUrl.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
    );
    const vimeoMatch = embedUrl.match(/vimeo\.com\/(\d+)/);
    if (ytMatch) {
      src = `https://www.youtube.com/embed/${ytMatch[1]}`;
    } else if (vimeoMatch) {
      src = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    editor
      .chain()
      .focus()
      .insertContent(
        `<div data-type="embed" class="my-4"><iframe src="${src}" width="100%" height="400" frameborder="0" allowfullscreen style="border-radius:8px;aspect-ratio:16/9;width:100%;height:auto;"></iframe></div>`,
      )
      .run();
    setShowEmbedDialog(false);
    setEmbedUrl("");
  }, [embedUrl, editor]);

  const applyLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
    }
    setShowLinkDialog(false);
  }, [editor, linkUrl]);

  if (!editor) {
    return (
      <div className={cn("border rounded-lg", className)}>
        <div className="border-b bg-muted/50 p-2 h-12" />
        <div className="p-4 min-h-[400px] animate-pulse bg-muted/20" />
      </div>
    );
  }

  const wordCount = editor.storage.characterCount.words();
  const charCount = editor.storage.characterCount.characters();

  return (
    <TooltipProvider>
      <div className={cn("border rounded-lg overflow-hidden bg-background", className)}>
        {/* Toolbar */}
        <div className="border-b bg-muted/50 p-1.5 flex flex-wrap items-center gap-0.5 sticky top-0 z-10">
          {/* Undo / Redo */}
          <ToolbarButton icon={<Undo className="h-4 w-4" />} tooltip="Undo (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo() || disabled} />
          <ToolbarButton icon={<Redo className="h-4 w-4" />} tooltip="Redo (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo() || disabled} />

          <Separator orientation="vertical" className="h-6 mx-0.5" />

          {/* Block Type Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1" disabled={disabled}>
                <Type className="h-3.5 w-3.5" />
                {editor.isActive("heading", { level: 1 }) ? "H1" : editor.isActive("heading", { level: 2 }) ? "H2" : editor.isActive("heading", { level: 3 }) ? "H3" : editor.isActive("heading", { level: 4 }) ? "H4" : "Normal"}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
                <span className="text-sm">Normal text</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                <span className="text-2xl font-bold">Heading 1</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                <span className="text-xl font-bold">Heading 2</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                <span className="text-lg font-semibold">Heading 3</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>
                <span className="text-base font-semibold">Heading 4</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Font Size Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1" disabled={disabled}>
                <span className="font-mono text-[10px]">A</span>
                <span className="font-mono text-xs">A</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {FONT_SIZES.map((size) => (
                <DropdownMenuItem key={size.label} onClick={() => {
                  if (!size.value) {
                    editor.chain().focus().removeEmptyTextStyle().run();
                  } else {
                    editor.chain().focus().setMark("textStyle", { fontSize: size.value }).run();
                  }
                }}>
                  <span style={size.value ? { fontSize: size.value } : undefined}>{size.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6 mx-0.5" />

          {/* Text Formatting */}
          <ToolbarToggle icon={<Bold className="h-4 w-4" />} tooltip="Bold (Ctrl+B)" pressed={editor.isActive("bold")} onPressedChange={() => editor.chain().focus().toggleBold().run()} disabled={disabled} />
          <ToolbarToggle icon={<Italic className="h-4 w-4" />} tooltip="Italic (Ctrl+I)" pressed={editor.isActive("italic")} onPressedChange={() => editor.chain().focus().toggleItalic().run()} disabled={disabled} />
          <ToolbarToggle icon={<UnderlineIcon className="h-4 w-4" />} tooltip="Underline (Ctrl+U)" pressed={editor.isActive("underline")} onPressedChange={() => editor.chain().focus().toggleUnderline().run()} disabled={disabled} />
          <ToolbarToggle icon={<Strikethrough className="h-4 w-4" />} tooltip="Strikethrough" pressed={editor.isActive("strike")} onPressedChange={() => editor.chain().focus().toggleStrike().run()} disabled={disabled} />
          <ToolbarToggle icon={<Code className="h-4 w-4" />} tooltip="Inline Code" pressed={editor.isActive("code")} onPressedChange={() => editor.chain().focus().toggleCode().run()} disabled={disabled} />
          <ToolbarToggle icon={<SubscriptIcon className="h-4 w-4" />} tooltip="Subscript" pressed={editor.isActive("subscript")} onPressedChange={() => editor.chain().focus().toggleSubscript().run()} disabled={disabled} />
          <ToolbarToggle icon={<SuperscriptIcon className="h-4 w-4" />} tooltip="Superscript" pressed={editor.isActive("superscript")} onPressedChange={() => editor.chain().focus().toggleSuperscript().run()} disabled={disabled} />

          <Separator orientation="vertical" className="h-6 mx-0.5" />

          {/* Text Color */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={disabled}>
                    <div className="flex flex-col items-center">
                      <Palette className="h-3.5 w-3.5" />
                      <div className="h-0.5 w-3.5 rounded-full mt-0.5" style={{ backgroundColor: editor.getAttributes("textStyle").color || "currentColor" }} />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Text Color</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="w-40">
              {TEXT_COLORS.map((color) => (
                <DropdownMenuItem key={color.label} onClick={() => {
                  if (!color.value) {
                    editor.chain().focus().unsetColor().run();
                  } else {
                    editor.chain().focus().setColor(color.value).run();
                  }
                }}>
                  <div className="flex items-center gap-2">
                    <div className={cn("h-4 w-4 rounded-full border border-border")} style={color.value ? { backgroundColor: color.value } : { backgroundColor: "currentColor" }} />
                    <span>{color.label}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Highlight Color */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant={editor.isActive("highlight") ? "secondary" : "ghost"} size="icon" className="h-8 w-8" disabled={disabled}>
                    <Highlighter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Highlight</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuItem onClick={() => editor.chain().focus().unsetHighlight().run()}>
                <div className="flex items-center gap-2">
                  <RemoveFormatting className="h-4 w-4" />
                  <span>Remove</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {HIGHLIGHT_COLORS.map((color) => (
                <DropdownMenuItem key={color.label} onClick={() => editor.chain().focus().toggleHighlight({ color: color.value }).run()}>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border border-border" style={{ backgroundColor: color.value }} />
                    <span>{color.label}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6 mx-0.5" />

          {/* Lists & Blocks */}
          <ToolbarToggle icon={<List className="h-4 w-4" />} tooltip="Bullet List" pressed={editor.isActive("bulletList")} onPressedChange={() => editor.chain().focus().toggleBulletList().run()} disabled={disabled} />
          <ToolbarToggle icon={<ListOrdered className="h-4 w-4" />} tooltip="Numbered List" pressed={editor.isActive("orderedList")} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()} disabled={disabled} />
          <ToolbarToggle icon={<Quote className="h-4 w-4" />} tooltip="Blockquote" pressed={editor.isActive("blockquote")} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()} disabled={disabled} />
          <ToolbarToggle icon={<Code2 className="h-4 w-4" />} tooltip="Code Block" pressed={editor.isActive("codeBlock")} onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()} disabled={disabled} />
          <ToolbarButton icon={<Minus className="h-4 w-4" />} tooltip="Horizontal Rule" onClick={() => editor.chain().focus().setHorizontalRule().run()} disabled={disabled} />

          <Separator orientation="vertical" className="h-6 mx-0.5" />

          {/* Alignment */}
          <ToolbarToggle icon={<AlignLeft className="h-4 w-4" />} tooltip="Align Left" pressed={editor.isActive({ textAlign: "left" })} onPressedChange={() => editor.chain().focus().setTextAlign("left").run()} disabled={disabled} />
          <ToolbarToggle icon={<AlignCenter className="h-4 w-4" />} tooltip="Align Center" pressed={editor.isActive({ textAlign: "center" })} onPressedChange={() => editor.chain().focus().setTextAlign("center").run()} disabled={disabled} />
          <ToolbarToggle icon={<AlignRight className="h-4 w-4" />} tooltip="Align Right" pressed={editor.isActive({ textAlign: "right" })} onPressedChange={() => editor.chain().focus().setTextAlign("right").run()} disabled={disabled} />
          <ToolbarToggle icon={<AlignJustify className="h-4 w-4" />} tooltip="Justify" pressed={editor.isActive({ textAlign: "justify" })} onPressedChange={() => editor.chain().focus().setTextAlign("justify").run()} disabled={disabled} />

          <Separator orientation="vertical" className="h-6 mx-0.5" />

          {/* Media & Links */}
          <ToolbarButton icon={<ImageIcon className="h-4 w-4" />} tooltip="Insert Image" onClick={addImage} disabled={disabled} />
          <ToolbarButton icon={<LinkIcon className="h-4 w-4" />} tooltip="Add Link (Ctrl+K)" onClick={addLink} disabled={disabled} variant={editor.isActive("link") ? "secondary" : "ghost"} />
          {editor.isActive("link") && (
            <ToolbarButton icon={<Unlink className="h-4 w-4" />} tooltip="Remove Link" onClick={removeLink} disabled={disabled} />
          )}
          <ToolbarButton icon={<Youtube className="h-4 w-4" />} tooltip="Embed Video" onClick={() => { setEmbedUrl(""); setShowEmbedDialog(true); }} disabled={disabled} />
          {agencyId && (
            <ToolbarButton icon={<FolderOpen className="h-4 w-4" />} tooltip="Media Library" onClick={() => setShowMediaPicker(true)} disabled={disabled} />
          )}

          <Separator orientation="vertical" className="h-6 mx-0.5" />

          {/* Table */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant={editor.isActive("table") ? "secondary" : "ghost"} size="icon" className="h-8 w-8" disabled={disabled}>
                    <TableIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Table</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">
              {!editor.isActive("table") ? (
                <>
                  <DropdownMenuItem onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
                    <TableIcon className="h-4 w-4 mr-2" />Insert 3x3 Table
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().insertTable({ rows: 4, cols: 4, withHeaderRow: true }).run()}>
                    <TableIcon className="h-4 w-4 mr-2" />Insert 4x4 Table
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run()}>
                    <TableIcon className="h-4 w-4 mr-2" />Insert 2x2 Table
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()}>
                    <Plus className="h-4 w-4 mr-2" />Add Column Before
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
                    <Plus className="h-4 w-4 mr-2" />Add Column After
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()}>
                    <Plus className="h-4 w-4 mr-2" />Add Row Before
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>
                    <Plus className="h-4 w-4 mr-2" />Add Row After
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()}>
                    <Trash2 className="h-4 w-4 mr-2" />Delete Column
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()}>
                    <Trash2 className="h-4 w-4 mr-2" />Delete Row
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => editor.chain().focus().mergeCells().run()}>
                    <TableCellsMerge className="h-4 w-4 mr-2" />Merge Cells
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().splitCell().run()}>
                    <TableCellsMerge className="h-4 w-4 mr-2" />Split Cell
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeaderRow().run()}>
                    Toggle Header Row
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => editor.chain().focus().deleteTable().run()}>
                    <Trash2 className="h-4 w-4 mr-2" />Delete Table
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Formatting */}
          <ToolbarButton icon={<RemoveFormatting className="h-4 w-4" />} tooltip="Clear Formatting" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} disabled={disabled} />
        </div>

        {/* Editor Content */}
        <EditorContent editor={editor} />

        {/* Footer: Word & Character Count */}
        <div className="border-t bg-muted/30 px-3 py-1.5 flex items-center justify-between text-xs text-muted-foreground">
          <span>{wordCount} {wordCount === 1 ? "word" : "words"} &middot; {charCount} {charCount === 1 ? "character" : "characters"}</span>
          <span>~{Math.max(1, Math.ceil(wordCount / 200))} min read</span>
        </div>
      </div>

      {/* Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue={agencyId ? "media" : "url"}>
            <TabsList className="w-full">
              {agencyId && (
                <TabsTrigger value="media" className="flex-1">
                  <FolderOpen className="h-4 w-4 mr-2" />Media Library
                </TabsTrigger>
              )}
              <TabsTrigger value="url" className="flex-1">
                <Upload className="h-4 w-4 mr-2" />URL
              </TabsTrigger>
            </TabsList>
            {agencyId && (
              <TabsContent value="media" className="space-y-2 mt-4">
                <p className="text-sm text-muted-foreground">Select an image from your media library:</p>
                <Button type="button" variant="outline" className="w-full" onClick={() => { setShowImageDialog(false); setShowMediaPicker(true); }}>
                  <FolderOpen className="h-4 w-4 mr-2" />Open Media Library
                </Button>
              </TabsContent>
            )}
            <TabsContent value="url" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="image-url">Image URL</Label>
                <Input id="image-url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (imageUrl && editor) {
                      editor.chain().focus().setImage({ src: imageUrl, alt: imageAlt || undefined }).run();
                      setShowImageDialog(false);
                      setImageUrl("");
                      setImageAlt("");
                    }
                  }
                }} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image-alt">Alt Text (SEO & Accessibility)</Label>
                <Input id="image-alt" value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} placeholder="Describe the image for accessibility" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowImageDialog(false)}>Cancel</Button>
                <Button onClick={() => {
                  if (imageUrl && editor) {
                    editor.chain().focus().setImage({ src: imageUrl, alt: imageAlt || undefined }).run();
                    setShowImageDialog(false);
                    setImageUrl("");
                    setImageAlt("");
                  }
                }} disabled={!imageUrl}>Insert</Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Media Picker */}
      {agencyId && (
        <MediaPickerDialog
          open={showMediaPicker}
          onClose={() => setShowMediaPicker(false)}
          agencyId={agencyId}
          siteId={siteId}
          fileType="image"
          title="Select Image"
          onSelect={(selection) => {
            const files = Array.isArray(selection) ? selection : [selection];
            if (files.length > 0 && editor) {
              for (const file of files) {
                editor.chain().focus().setImage({ src: file.publicUrl, alt: file.altText || file.originalName || "" }).run();
              }
            }
            setShowMediaPicker(false);
          }}
        />
      )}

      {/* Embed Video Dialog */}
      <Dialog open={showEmbedDialog} onOpenChange={setShowEmbedDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Embed Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="embed-url">YouTube or Vimeo URL</Label>
            <Input id="embed-url" value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); insertEmbed(); } }} />
            <p className="text-xs text-muted-foreground">Paste a YouTube or Vimeo video URL to embed it in your post.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmbedDialog(false)}>Cancel</Button>
            <Button onClick={insertEmbed} disabled={!embedUrl}>Embed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="link-url">URL</Label>
            <Input id="link-url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyLink(); } }} />
            <p className="text-xs text-muted-foreground">Leave empty and click Apply to remove an existing link.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>Cancel</Button>
            <Button onClick={applyLink}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

/* Toolbar Helper Components */

function ToolbarButton({
  icon,
  tooltip,
  onClick,
  disabled,
  variant = "ghost",
}: {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "ghost" | "secondary";
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant={variant} size="icon" className="h-8 w-8" onClick={onClick} disabled={disabled}>
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function ToolbarToggle({
  icon,
  tooltip,
  pressed,
  onPressedChange,
  disabled,
}: {
  icon: React.ReactNode;
  tooltip: string;
  pressed: boolean;
  onPressedChange: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle size="sm" className="h-8 w-8 p-0" pressed={pressed} onPressedChange={onPressedChange} disabled={disabled}>
          {icon}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
