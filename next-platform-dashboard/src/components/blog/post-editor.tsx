"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { useCallback, useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Link as LinkIcon,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Minus,
  Upload,
  FolderOpen,
  Youtube,
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
import { cn } from "@/lib/utils";
import { MediaPickerDialog } from "@/components/media/media-picker-dialog";
import type { MediaFile } from "@/lib/media/media-service";

const lowlight = createLowlight(common);

interface PostEditorProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>, html: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Agency ID for media library access */
  agencyId?: string;
  /** Site ID for media library scoping */
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
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: false, // Use CodeBlockLowlight instead
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
          "[&_.is-editor-empty:first-child::before]:pointer-events-none"
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON(), editor.getHTML());
    },
  });

  // Update content when prop changes (for loading saved content)
  useEffect(() => {
    if (editor && content && Object.keys(content).length > 0) {
      const currentContent = editor.getJSON();
      if (JSON.stringify(currentContent) !== JSON.stringify(content)) {
        editor.commands.setContent(content as Parameters<typeof editor.commands.setContent>[0]);
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
    if (editor) {
      editor.chain().focus().unsetLink().run();
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className={cn("border rounded-lg", className)}>
        <div className="border-b bg-muted/50 p-2 h-12" />
        <div className="p-4 min-h-[400px] animate-pulse bg-muted/20" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn("border rounded-lg overflow-hidden bg-background", className)}>
        {/* Toolbar */}
        <div className="border-b bg-muted/50 p-2 flex flex-wrap items-center gap-1 sticky top-0 z-10">
          {/* History */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo() || disabled}
              >
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo() || disabled}
              >
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Headings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("heading", { level: 1 })}
                onPressedChange={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                disabled={disabled}
              >
                <Heading1 className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Heading 1</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("heading", { level: 2 })}
                onPressedChange={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                disabled={disabled}
              >
                <Heading2 className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Heading 2</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("heading", { level: 3 })}
                onPressedChange={() =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
                disabled={disabled}
              >
                <Heading3 className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Heading 3</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Formatting */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("bold")}
                onPressedChange={() => editor.chain().focus().toggleBold().run()}
                disabled={disabled}
              >
                <Bold className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Bold (Ctrl+B)</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("italic")}
                onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                disabled={disabled}
              >
                <Italic className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Italic (Ctrl+I)</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("strike")}
                onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                disabled={disabled}
              >
                <Strikethrough className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Strikethrough</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("code")}
                onPressedChange={() => editor.chain().focus().toggleCode().run()}
                disabled={disabled}
              >
                <Code className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Inline Code</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Lists */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("bulletList")}
                onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                disabled={disabled}
              >
                <List className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Bullet List</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("orderedList")}
                onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                disabled={disabled}
              >
                <ListOrdered className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Numbered List</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("blockquote")}
                onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
                disabled={disabled}
              >
                <Quote className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Quote</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("codeBlock")}
                onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
                disabled={disabled}
              >
                <Code2 className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Code Block</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                disabled={disabled}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Horizontal Rule</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Alignment */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: "left" })}
                onPressedChange={() => editor.chain().focus().setTextAlign("left").run()}
                disabled={disabled}
              >
                <AlignLeft className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Align Left</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: "center" })}
                onPressedChange={() => editor.chain().focus().setTextAlign("center").run()}
                disabled={disabled}
              >
                <AlignCenter className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Align Center</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: "right" })}
                onPressedChange={() => editor.chain().focus().setTextAlign("right").run()}
                disabled={disabled}
              >
                <AlignRight className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Align Right</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Media */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                type="button"
                variant="ghost" 
                size="icon" 
                onClick={addImage}
                disabled={disabled}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Insert Image</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                type="button"
                variant={editor.isActive("link") ? "secondary" : "ghost"}
                size="icon" 
                onClick={addLink}
                disabled={disabled}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Link</TooltipContent>
          </Tooltip>
          
          {editor.isActive("link") && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  onClick={removeLink}
                  disabled={disabled}
                >
                  <Unlink className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove Link</TooltipContent>
            </Tooltip>
          )}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                type="button"
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  setEmbedUrl("");
                  setShowEmbedDialog(true);
                }}
                disabled={disabled}
              >
                <Youtube className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Embed Video</TooltipContent>
          </Tooltip>

          {agencyId && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowMediaPicker(true)}
                  disabled={disabled}
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Media Library</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Editor */}
        <EditorContent editor={editor} />
      </div>

      {/* Image Dialog - Tabbed (URL / Media Library) */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue={agencyId ? "media" : "url"}>
            <TabsList className="w-full">
              {agencyId && <TabsTrigger value="media" className="flex-1"><FolderOpen className="h-4 w-4 mr-2" />Media Library</TabsTrigger>}
              <TabsTrigger value="url" className="flex-1"><Upload className="h-4 w-4 mr-2" />URL</TabsTrigger>
            </TabsList>
            {agencyId && (
              <TabsContent value="media" className="space-y-2 mt-4">
                <p className="text-sm text-muted-foreground">Select an image from your media library:</p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowImageDialog(false);
                    setShowMediaPicker(true);
                  }}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Open Media Library
                </Button>
              </TabsContent>
            )}
            <TabsContent value="url" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="image-url">Image URL</Label>
                <Input
                  id="image-url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (imageUrl && editor) {
                        editor.chain().focus().setImage({ src: imageUrl, alt: imageAlt || undefined }).run();
                        setShowImageDialog(false);
                        setImageUrl("");
                        setImageAlt("");
                      }
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image-alt">Alt Text</Label>
                <Input
                  id="image-alt"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Describe the image for accessibility"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowImageDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (imageUrl && editor) {
                      editor.chain().focus().setImage({ src: imageUrl, alt: imageAlt || undefined }).run();
                      setShowImageDialog(false);
                      setImageUrl("");
                      setImageAlt("");
                    }
                  }}
                  disabled={!imageUrl}
                >
                  Insert
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Media Picker Dialog */}
      {agencyId && (
        <MediaPickerDialog
          open={showMediaPicker}
          onClose={() => setShowMediaPicker(false)}
          agencyId={agencyId}
          siteId={siteId}
          fileType="image"
          title="Select Image"
          onSelect={(files: MediaFile[]) => {
            if (files.length > 0 && editor) {
              for (const file of files) {
                editor.chain().focus().setImage({ 
                  src: file.url, 
                  alt: file.alt_text || file.original_name || "" 
                }).run();
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
            <Input
              id="embed-url"
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (embedUrl && editor) {
                    // Convert YouTube/Vimeo URLs to embed format
                    let src = embedUrl;
                    const ytMatch = embedUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
                    const vimeoMatch = embedUrl.match(/vimeo\.com\/(\d+)/);
                    if (ytMatch) {
                      src = `https://www.youtube.com/embed/${ytMatch[1]}`;
                    } else if (vimeoMatch) {
                      src = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
                    }
                    editor.chain().focus().insertContent(
                      `<div data-type="embed" class="my-4"><iframe src="${src}" width="100%" height="400" frameborder="0" allowfullscreen style="border-radius:8px;aspect-ratio:16/9;width:100%;height:auto;"></iframe></div>`
                    ).run();
                    setShowEmbedDialog(false);
                    setEmbedUrl("");
                  }
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Paste a YouTube or Vimeo video URL to embed it in your post.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmbedDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (embedUrl && editor) {
                  let src = embedUrl;
                  const ytMatch = embedUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
                  const vimeoMatch = embedUrl.match(/vimeo\.com\/(\d+)/);
                  if (ytMatch) {
                    src = `https://www.youtube.com/embed/${ytMatch[1]}`;
                  } else if (vimeoMatch) {
                    src = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
                  }
                  editor.chain().focus().insertContent(
                    `<div data-type="embed" class="my-4"><iframe src="${src}" width="100%" height="400" frameborder="0" allowfullscreen style="border-radius:8px;aspect-ratio:16/9;width:100%;height:auto;"></iframe></div>`
                  ).run();
                  setShowEmbedDialog(false);
                  setEmbedUrl("");
                }
              }}
              disabled={!embedUrl}
            >
              Embed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link URL Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (editor) {
                    if (linkUrl === "") {
                      editor.chain().focus().extendMarkRange("link").unsetLink().run();
                    } else {
                      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
                    }
                    setShowLinkDialog(false);
                  }
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty and click Apply to remove an existing link.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editor) {
                  if (linkUrl === "") {
                    editor.chain().focus().extendMarkRange("link").unsetLink().run();
                  } else {
                    editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
                  }
                  setShowLinkDialog(false);
                }
              }}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
