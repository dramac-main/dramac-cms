"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Code,
  File,
  FileCode,
  FileCog,
  FileJson,
  FileText,
  FolderOpen,
  FolderClosed,
  Plus,
  Save,
  Trash2,
  RefreshCw,
  AlertCircle,
  Check,
  ChevronRight,
  ChevronDown,
  Search,
  X,
  Copy,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Dynamic import for Monaco Editor
const Editor = dynamic(
  () => import("@monaco-editor/react").then((mod) => {
    // Configure Monaco to use CDN instead of local files
    if (typeof window !== 'undefined') {
      (window as any).MonacoEnvironment = {
        getWorkerUrl: function (_moduleId: any, label: string) {
          if (label === 'json') {
            return 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/language/json/json.worker.js';
          }
          if (label === 'css' || label === 'scss' || label === 'less') {
            return 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/language/css/css.worker.js';
          }
          if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/language/html/html.worker.js';
          }
          if (label === 'typescript' || label === 'javascript') {
            return 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/language/typescript/ts.worker.js';
          }
          return 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/editor/editor.worker.js';
        }
      };
    }
    return mod.default;
  }),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-[#1e1e1e] text-gray-400">
        Loading editor...
      </div>
    ),
  }
);

// ============================================================================
// Types
// ============================================================================

export interface ModuleFile {
  id: string;
  path: string;
  content: string;
  fileType: "component" | "style" | "config" | "asset" | "other";
  isModified?: boolean;
  isNew?: boolean;
}

interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileTreeNode[];
  file?: ModuleFile;
}

interface MultiFileEditorProps {
  moduleId: string;
  files: ModuleFile[];
  onSave: (files: ModuleFile[]) => Promise<void>;
  onFileCreate?: (path: string, content: string) => Promise<ModuleFile>;
  onFileDelete?: (path: string) => Promise<void>;
  onFileRename?: (oldPath: string, newPath: string) => Promise<void>;
  readOnly?: boolean;
  defaultFile?: string;
  className?: string;
}

// ============================================================================
// File Tree Component
// ============================================================================

function FileTreeItem({
  node,
  selectedPath,
  onSelect,
  onDelete,
  onRename,
  onDuplicate,
  expandedFolders,
  onToggleFolder,
}: {
  node: FileTreeNode;
  selectedPath: string | null;
  onSelect: (file: ModuleFile) => void;
  onDelete?: (path: string) => void;
  onRename?: (oldPath: string) => void;
  onDuplicate?: (path: string) => void;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
}) {
  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedPath === node.path;

  const getFileIcon = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) {
      return isExpanded ? (
        <FolderOpen className="h-4 w-4 text-yellow-500" />
      ) : (
        <FolderClosed className="h-4 w-4 text-yellow-500" />
      );
    }

    if (fileName.endsWith(".tsx") || fileName.endsWith(".jsx")) {
      return <FileCode className="h-4 w-4 text-blue-400" />;
    }
    if (fileName.endsWith(".ts") || fileName.endsWith(".js")) {
      return <FileCode className="h-4 w-4 text-yellow-400" />;
    }
    if (fileName.endsWith(".json")) {
      return <FileJson className="h-4 w-4 text-orange-400" />;
    }
    if (fileName.endsWith(".css") || fileName.endsWith(".scss")) {
      return <FileCog className="h-4 w-4 text-pink-400" />;
    }
    if (fileName.endsWith(".md")) {
      return <FileText className="h-4 w-4 text-gray-400" />;
    }
    return <File className="h-4 w-4 text-gray-400" />;
  };

  if (node.isDirectory) {
    return (
      <div>
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-muted rounded-sm",
            isSelected && "bg-muted"
          )}
          onClick={() => onToggleFolder(node.path)}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          {getFileIcon(node.name, true)}
          <span className="text-sm truncate">{node.name}</span>
        </div>
        {isExpanded && node.children && (
          <div className="ml-4">
            {node.children.map((child) => (
              <FileTreeItem
                key={child.path}
                node={child}
                selectedPath={selectedPath}
                onSelect={onSelect}
                onDelete={onDelete}
                onRename={onRename}
                onDuplicate={onDuplicate}
                expandedFolders={expandedFolders}
                onToggleFolder={onToggleFolder}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-muted rounded-sm",
            isSelected && "bg-accent text-accent-foreground"
          )}
          onClick={() => node.file && onSelect(node.file)}
        >
          <span className="w-3" />
          {getFileIcon(node.name, false)}
          <span className="text-sm truncate flex-1">{node.name}</span>
          {node.file?.isModified && (
            <span className="w-2 h-2 rounded-full bg-primary" />
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {onRename && (
          <ContextMenuItem onClick={() => onRename(node.path)}>
            <Pencil className="h-4 w-4 mr-2" />
            Rename
          </ContextMenuItem>
        )}
        {onDuplicate && (
          <ContextMenuItem onClick={() => onDuplicate(node.path)}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </ContextMenuItem>
        )}
        {(onRename || onDuplicate) && onDelete && <ContextMenuSeparator />}
        {onDelete && (
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(node.path)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function MultiFileEditor({
  moduleId,
  files: initialFiles,
  onSave,
  onFileCreate,
  onFileDelete,
  onFileRename,
  readOnly = false,
  defaultFile = "index.tsx",
  className,
}: MultiFileEditorProps) {
  // State
  const [files, setFiles] = useState<ModuleFile[]>(initialFiles);
  const [selectedFile, setSelectedFile] = useState<ModuleFile | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Dialogs
  const [newFileDialog, setNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [renameDialog, setRenameDialog] = useState(false);
  const [renameTarget, setRenameTarget] = useState("");
  const [newName, setNewName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Update files when props change
  useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles]);

  // Select default file on mount
  useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      const defaultFileObj = files.find((f) => f.path === defaultFile) || files[0];
      if (defaultFileObj) {
        setSelectedFile(defaultFileObj);
        setOpenTabs([defaultFileObj.path]);
      }
    }
  }, [files, selectedFile, defaultFile]);

  // Build file tree
  const fileTree = useMemo(() => {
    const root: FileTreeNode[] = [];
    const folders = new Map<string, FileTreeNode>();

    // Sort files by path
    const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

    for (const file of sortedFiles) {
      const parts = file.path.split("/");
      let currentPath = "";

      // Create folder nodes
      for (let i = 0; i < parts.length - 1; i++) {
        const folderName = parts[i];
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

        if (!folders.has(currentPath)) {
          const folderNode: FileTreeNode = {
            name: folderName,
            path: currentPath,
            isDirectory: true,
            children: [],
          };
          folders.set(currentPath, folderNode);

          if (parentPath) {
            folders.get(parentPath)?.children?.push(folderNode);
          } else {
            root.push(folderNode);
          }
        }
      }

      // Create file node
      const fileNode: FileTreeNode = {
        name: parts[parts.length - 1],
        path: file.path,
        isDirectory: false,
        file,
      };

      if (parts.length > 1) {
        const parentFolder = folders.get(parts.slice(0, -1).join("/"));
        parentFolder?.children?.push(fileNode);
      } else {
        root.push(fileNode);
      }
    }

    return root;
  }, [files]);

  // Filtered file tree for search
  const filteredTree = useMemo(() => {
    if (!searchQuery) return fileTree;

    const filterNode = (node: FileTreeNode): FileTreeNode | null => {
      if (node.isDirectory) {
        const filteredChildren = (node.children || [])
          .map(filterNode)
          .filter(Boolean) as FileTreeNode[];
        if (filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
        return null;
      }

      if (node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return node;
      }
      return null;
    };

    return fileTree.map(filterNode).filter(Boolean) as FileTreeNode[];
  }, [fileTree, searchQuery]);

  // Handle file selection
  const handleSelectFile = useCallback((file: ModuleFile) => {
    setSelectedFile(file);
    if (!openTabs.includes(file.path)) {
      setOpenTabs((prev) => [...prev, file.path]);
    }
  }, [openTabs]);

  // Handle tab close
  const handleCloseTab = useCallback((path: string) => {
    setOpenTabs((prev) => prev.filter((p) => p !== path));
    if (selectedFile?.path === path) {
      const remaining = openTabs.filter((p) => p !== path);
      if (remaining.length > 0) {
        const lastTab = remaining[remaining.length - 1];
        const file = files.find((f) => f.path === lastTab);
        setSelectedFile(file || null);
      } else {
        setSelectedFile(null);
      }
    }
  }, [selectedFile, openTabs, files]);

  // Handle content change
  const handleContentChange = useCallback((content: string | undefined) => {
    if (!selectedFile || content === undefined) return;

    setFiles((prev) =>
      prev.map((f) =>
        f.path === selectedFile.path
          ? { ...f, content, isModified: true }
          : f
      )
    );

    setSelectedFile((prev) =>
      prev ? { ...prev, content, isModified: true } : null
    );
  }, [selectedFile]);

  // Handle save
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const modifiedFiles = files.filter((f) => f.isModified || f.isNew);
      await onSave(modifiedFiles);
      
      setFiles((prev) =>
        prev.map((f) => ({ ...f, isModified: false, isNew: false }))
      );
      
      setSelectedFile((prev) =>
        prev ? { ...prev, isModified: false, isNew: false } : null
      );
    } catch (error) {
      console.error("Save failed:", error);
    }
    setSaving(false);
  }, [files, onSave]);

  // Handle new file
  const handleNewFile = useCallback(async () => {
    if (!newFileName.trim() || !onFileCreate) return;

    let path = newFileName.trim();
    if (!path.includes(".")) {
      path = `${path}.tsx`;
    }

    const template = getFileTemplate(path);
    const newFile = await onFileCreate(path, template);
    
    setFiles((prev) => [...prev, { ...newFile, isNew: true }]);
    setSelectedFile(newFile);
    setOpenTabs((prev) => [...prev, newFile.path]);
    setNewFileDialog(false);
    setNewFileName("");
  }, [newFileName, onFileCreate]);

  // Handle delete
  const handleDelete = useCallback(async (path: string) => {
    if (!onFileDelete) return;

    await onFileDelete(path);
    setFiles((prev) => prev.filter((f) => f.path !== path));
    
    if (selectedFile?.path === path) {
      handleCloseTab(path);
    }
    
    setDeleteConfirm(null);
  }, [onFileDelete, selectedFile, handleCloseTab]);

  // Handle rename
  const handleRename = useCallback(async () => {
    if (!renameTarget || !newName.trim() || !onFileRename) return;

    await onFileRename(renameTarget, newName.trim());
    
    setFiles((prev) =>
      prev.map((f) =>
        f.path === renameTarget ? { ...f, path: newName.trim() } : f
      )
    );
    
    if (selectedFile?.path === renameTarget) {
      setSelectedFile((prev) =>
        prev ? { ...prev, path: newName.trim() } : null
      );
    }
    
    setOpenTabs((prev) =>
      prev.map((p) => (p === renameTarget ? newName.trim() : p))
    );
    
    setRenameDialog(false);
    setRenameTarget("");
    setNewName("");
  }, [renameTarget, newName, onFileRename, selectedFile]);

  // Handle duplicate
  const handleDuplicate = useCallback(async (path: string) => {
    if (!onFileCreate) return;

    const file = files.find((f) => f.path === path);
    if (!file) return;

    const ext = path.includes(".") ? path.substring(path.lastIndexOf(".")) : "";
    const baseName = path.includes(".")
      ? path.substring(0, path.lastIndexOf("."))
      : path;
    
    let newPath = `${baseName}-copy${ext}`;
    let counter = 1;
    while (files.some((f) => f.path === newPath)) {
      newPath = `${baseName}-copy-${counter}${ext}`;
      counter++;
    }

    const newFile = await onFileCreate(newPath, file.content);
    setFiles((prev) => [...prev, { ...newFile, isNew: true }]);
    setSelectedFile(newFile);
    setOpenTabs((prev) => [...prev, newFile.path]);
  }, [files, onFileCreate]);

  // Toggle folder expansion
  const handleToggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Get editor language
  const getLanguage = (path: string) => {
    if (path.endsWith(".tsx")) return "typescript";
    if (path.endsWith(".ts")) return "typescript";
    if (path.endsWith(".jsx")) return "javascript";
    if (path.endsWith(".js")) return "javascript";
    if (path.endsWith(".json")) return "json";
    if (path.endsWith(".css")) return "css";
    if (path.endsWith(".scss")) return "scss";
    if (path.endsWith(".md")) return "markdown";
    return "plaintext";
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        setShowSearch(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = files.some((f) => f.isModified || f.isNew);

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="border-b pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Module Files
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-xs">
                Unsaved changes
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowSearch(true)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Search files (Ctrl+P)</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {!readOnly && onFileCreate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewFileDialog(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                New File
              </Button>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={saving || !hasUnsavedChanges}
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <ResizablePanelGroup orientation="horizontal">
          {/* File Tree Panel */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
            <div className="h-full flex flex-col border-r">
              {/* Search */}
              {showSearch && (
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-8 h-8"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={() => {
                        setShowSearch(false);
                        setSearchQuery("");
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* File Tree */}
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {filteredTree.map((node) => (
                    <FileTreeItem
                      key={node.path}
                      node={node}
                      selectedPath={selectedFile?.path || null}
                      onSelect={handleSelectFile}
                      onDelete={
                        !readOnly && onFileDelete
                          ? (path) => setDeleteConfirm(path)
                          : undefined
                      }
                      onRename={
                        !readOnly && onFileRename
                          ? (path) => {
                              setRenameTarget(path);
                              setNewName(path);
                              setRenameDialog(true);
                            }
                          : undefined
                      }
                      onDuplicate={
                        !readOnly && onFileCreate
                          ? handleDuplicate
                          : undefined
                      }
                      expandedFolders={expandedFolders}
                      onToggleFolder={handleToggleFolder}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Editor Panel */}
          <ResizablePanel defaultSize={80}>
            <div className="h-full flex flex-col">
              {/* Tabs */}
              {openTabs.length > 0 && (
                <div className="flex items-center border-b bg-muted/50 overflow-x-auto">
                  {openTabs.map((path) => {
                    const file = files.find((f) => f.path === path);
                    const isActive = selectedFile?.path === path;
                    return (
                      <div
                        key={path}
                        className={cn(
                          "flex items-center gap-1 px-3 py-1.5 text-sm cursor-pointer border-r hover:bg-background",
                          isActive && "bg-background border-b-2 border-b-primary"
                        )}
                        onClick={() => file && setSelectedFile(file)}
                      >
                        <span className="truncate max-w-[120px]">
                          {path.split("/").pop()}
                        </span>
                        {file?.isModified && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 opacity-50 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloseTab(path);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Editor */}
              <div className="flex-1">
                {selectedFile ? (
                  <Editor
                    height="100%"
                    language={getLanguage(selectedFile.path)}
                    value={selectedFile.content}
                    onChange={handleContentChange}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: true },
                      fontSize: 14,
                      lineNumbers: "on",
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      readOnly,
                      wordWrap: "on",
                      folding: true,
                      bracketPairColorization: { enabled: true },
                      formatOnPaste: true,
                      formatOnType: true,
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a file to edit</p>
                      <p className="text-sm mt-1">
                        or press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+P</kbd> to search
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </CardContent>

      {/* New File Dialog */}
      <Dialog open={newFileDialog} onOpenChange={setNewFileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
            <DialogDescription>
              Enter the file name or path. Extension will be added if not provided.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fileName">File Name</Label>
              <Input
                id="fileName"
                placeholder="e.g., components/Button.tsx"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNewFile();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFileDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleNewFile} disabled={!newFileName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialog} onOpenChange={setRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
            <DialogDescription>
              Enter the new name for the file.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newName">New Name</Label>
              <Input
                id="newName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!newName.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteConfirm}&quot;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

function getFileTemplate(path: string): string {
  const fileName = path.split("/").pop() || "";

  if (fileName === "index.tsx" || fileName === "index.ts") {
    return `// Module Entry Point
export { default } from './Component';
`;
  }

  if (path.endsWith(".tsx") || path.endsWith(".jsx")) {
    const componentName = fileName
      .replace(/\.(tsx|jsx)$/, "")
      .replace(/-./g, (x) => x[1].toUpperCase())
      .replace(/^./, (x) => x.toUpperCase());

    return `import React from 'react';

interface ${componentName}Props {
  // Define your props here
}

export default function ${componentName}({ }: ${componentName}Props) {
  return (
    <div>
      <h1>${componentName}</h1>
    </div>
  );
}
`;
  }

  if (path.endsWith(".ts") || path.endsWith(".js")) {
    return `// ${fileName}

export function example() {
  // Your code here
}
`;
  }

  if (path.endsWith(".css")) {
    return `/* ${fileName} */

.container {
  /* Your styles here */
}
`;
  }

  if (path.endsWith(".json")) {
    return `{
  
}
`;
  }

  return "";
}

export default MultiFileEditor;
