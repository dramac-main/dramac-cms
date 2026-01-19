"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  ChevronRight,
  ChevronDown,
  File,
  FileCode,
  FileCog,
  FileJson,
  FileText,
  FolderOpen,
  FolderClosed,
  Search,
  X,
  Plus,
  Trash2,
  Pencil,
  Copy,
  FolderPlus,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface FileItem {
  id: string;
  path: string;
  name: string;
  content?: string;
  isDirectory?: boolean;
  isModified?: boolean;
  isNew?: boolean;
  children?: FileItem[];
}

interface FileTreeProps {
  files: FileItem[];
  selectedPath: string | null;
  onSelect: (file: FileItem) => void;
  onDelete?: (path: string) => void;
  onRename?: (oldPath: string, newPath: string) => void;
  onDuplicate?: (path: string) => void;
  onNewFile?: (parentPath?: string) => void;
  onNewFolder?: (parentPath?: string) => void;
  expandedFolders?: Set<string>;
  onToggleFolder?: (path: string) => void;
  searchable?: boolean;
  className?: string;
  readOnly?: boolean;
}

interface FileTreeNodeProps {
  item: FileItem;
  depth: number;
  selectedPath: string | null;
  onSelect: (file: FileItem) => void;
  onDelete?: (path: string) => void;
  onRename?: (oldPath: string) => void;
  onDuplicate?: (path: string) => void;
  onNewFile?: (parentPath: string) => void;
  onNewFolder?: (parentPath: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
  readOnly?: boolean;
}

// ============================================================================
// File Icon Helper
// ============================================================================

function getFileIcon(fileName: string, isDirectory: boolean, isExpanded?: boolean) {
  if (isDirectory) {
    return isExpanded ? (
      <FolderOpen className="h-4 w-4 text-yellow-500 flex-shrink-0" />
    ) : (
      <FolderClosed className="h-4 w-4 text-yellow-500 flex-shrink-0" />
    );
  }

  const ext = fileName.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "tsx":
    case "jsx":
      return <FileCode className="h-4 w-4 text-blue-400 flex-shrink-0" />;
    case "ts":
    case "js":
      return <FileCode className="h-4 w-4 text-yellow-400 flex-shrink-0" />;
    case "json":
      return <FileJson className="h-4 w-4 text-orange-400 flex-shrink-0" />;
    case "css":
    case "scss":
    case "less":
      return <FileCog className="h-4 w-4 text-pink-400 flex-shrink-0" />;
    case "md":
    case "mdx":
      return <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />;
    default:
      return <File className="h-4 w-4 text-gray-400 flex-shrink-0" />;
  }
}

// ============================================================================
// File Tree Node Component
// ============================================================================

function FileTreeNode({
  item,
  depth,
  selectedPath,
  onSelect,
  onDelete,
  onRename,
  onDuplicate,
  onNewFile,
  onNewFolder,
  isExpanded,
  onToggle,
  readOnly,
}: FileTreeNodeProps) {
  const isSelected = selectedPath === item.path;
  const hasContextMenu = !readOnly && (onDelete || onRename || onDuplicate || onNewFile || onNewFolder);

  const handleClick = () => {
    if (item.isDirectory) {
      onToggle();
    } else {
      onSelect(item);
    }
  };

  const content = (
    <div
      className={cn(
        "flex items-center gap-1 py-1 px-2 cursor-pointer rounded-sm transition-colors",
        "hover:bg-muted",
        isSelected && !item.isDirectory && "bg-accent text-accent-foreground",
        item.isDirectory && isSelected && "bg-muted"
      )}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      onClick={handleClick}
    >
      {/* Expand/collapse chevron for directories */}
      {item.isDirectory ? (
        isExpanded ? (
          <ChevronDown className="h-3 w-3 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 flex-shrink-0" />
        )
      ) : (
        <span className="w-3 flex-shrink-0" />
      )}

      {/* File/folder icon */}
      {getFileIcon(item.name, !!item.isDirectory, isExpanded)}

      {/* File name */}
      <span className="text-sm truncate flex-1">{item.name}</span>

      {/* Modified indicator */}
      {item.isModified && (
        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
      )}
    </div>
  );

  if (!hasContextMenu) {
    return <div>{content}</div>;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>{content}</ContextMenuTrigger>
      <ContextMenuContent>
        {item.isDirectory && onNewFile && (
          <ContextMenuItem onClick={() => onNewFile(item.path)}>
            <Plus className="h-4 w-4 mr-2" />
            New File
          </ContextMenuItem>
        )}
        {item.isDirectory && onNewFolder && (
          <ContextMenuItem onClick={() => onNewFolder(item.path)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </ContextMenuItem>
        )}
        {item.isDirectory && (onNewFile || onNewFolder) && (onRename || onDelete) && (
          <ContextMenuSeparator />
        )}
        {onRename && (
          <ContextMenuItem onClick={() => onRename(item.path)}>
            <Pencil className="h-4 w-4 mr-2" />
            Rename
          </ContextMenuItem>
        )}
        {!item.isDirectory && onDuplicate && (
          <ContextMenuItem onClick={() => onDuplicate(item.path)}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </ContextMenuItem>
        )}
        {(onRename || onDuplicate) && onDelete && <ContextMenuSeparator />}
        {onDelete && (
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(item.path)}
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
// File Tree Component
// ============================================================================

export function FileTree({
  files,
  selectedPath,
  onSelect,
  onDelete,
  onRename,
  onDuplicate,
  onNewFile,
  onNewFolder,
  expandedFolders: externalExpandedFolders,
  onToggleFolder: externalToggleFolder,
  searchable = true,
  className,
  readOnly = false,
}: FileTreeProps) {
  // Internal expanded state (used if external not provided)
  const [internalExpandedFolders, setInternalExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Use external or internal expanded state
  const expandedFolders = externalExpandedFolders || internalExpandedFolders;
  const toggleFolder = useCallback(
    (path: string) => {
      if (externalToggleFolder) {
        externalToggleFolder(path);
      } else {
        setInternalExpandedFolders((prev) => {
          const next = new Set(prev);
          if (next.has(path)) {
            next.delete(path);
          } else {
            next.add(path);
          }
          return next;
        });
      }
    },
    [externalToggleFolder]
  );

  // Build tree structure from flat files
  const fileTree = useMemo(() => {
    const buildTree = (items: FileItem[]): FileItem[] => {
      const root: FileItem[] = [];
      const folders = new Map<string, FileItem>();

      // Sort items - directories first, then alphabetically
      const sorted = [...items].sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

      // Process each item
      for (const item of sorted) {
        if (item.isDirectory) {
          folders.set(item.path, { ...item, children: [] });
        }
      }

      // Build hierarchy
      for (const item of sorted) {
        const parentPath = item.path.includes("/")
          ? item.path.substring(0, item.path.lastIndexOf("/"))
          : "";

        if (parentPath && folders.has(parentPath)) {
          const parent = folders.get(parentPath)!;
          if (item.isDirectory) {
            parent.children!.push(folders.get(item.path)!);
          } else {
            parent.children!.push(item);
          }
        } else {
          if (item.isDirectory) {
            root.push(folders.get(item.path)!);
          } else {
            root.push(item);
          }
        }
      }

      return root;
    };

    return buildTree(files);
  }, [files]);

  // Filter tree based on search
  const filteredTree = useMemo(() => {
    if (!searchQuery) return fileTree;

    const query = searchQuery.toLowerCase();

    const filterItems = (items: FileItem[]): FileItem[] => {
      const result: FileItem[] = [];

      for (const item of items) {
        if (item.isDirectory && item.children) {
          const filteredChildren = filterItems(item.children);
          if (filteredChildren.length > 0) {
            result.push({ ...item, children: filteredChildren });
          }
        } else if (item.name.toLowerCase().includes(query)) {
          result.push(item);
        }
      }

      return result;
    };

    return filterItems(fileTree);
  }, [fileTree, searchQuery]);

  // Render tree recursively
  const renderTree = (items: FileItem[], depth: number = 0): React.ReactNode => {
    return items.map((item) => (
      <div key={item.path}>
        <FileTreeNode
          item={item}
          depth={depth}
          selectedPath={selectedPath}
          onSelect={onSelect}
          onDelete={onDelete}
          onRename={onRename ? (path) => onRename(path, path) : undefined}
          onDuplicate={onDuplicate}
          onNewFile={onNewFile}
          onNewFolder={onNewFolder}
          isExpanded={expandedFolders.has(item.path)}
          onToggle={() => toggleFolder(item.path)}
          readOnly={readOnly}
        />
        {item.isDirectory && item.children && expandedFolders.has(item.path) && (
          <div>{renderTree(item.children, depth + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Search bar */}
      {searchable && (
        <div className="p-2 border-b">
          {showSearch ? (
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
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Files</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowSearch(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* File tree */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {filteredTree.length > 0 ? (
            renderTree(filteredTree)
          ) : (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {searchQuery ? (
                <>No files matching &quot;{searchQuery}&quot;</>
              ) : (
                <>No files yet</>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Actions bar */}
      {!readOnly && (onNewFile || onNewFolder) && (
        <div className="p-2 border-t flex items-center gap-1">
          {onNewFile && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onNewFile()}
            >
              <Plus className="h-3 w-3 mr-1" />
              File
            </Button>
          )}
          {onNewFolder && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onNewFolder()}
            >
              <FolderPlus className="h-3 w-3 mr-1" />
              Folder
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default FileTree;
