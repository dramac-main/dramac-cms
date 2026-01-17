"use client";

import { useState } from "react";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  FolderPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { MediaFolder } from "@/lib/media/media-service";

interface FolderTreeProps {
  folders: MediaFolder[];
  currentFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder?: (name: string, parentId?: string) => Promise<void>;
  onRenameFolder?: (folderId: string, name: string) => Promise<void>;
  onDeleteFolder?: (folderId: string) => Promise<void>;
  canManageFolders?: boolean;
}

interface FolderNode extends MediaFolder {
  children: FolderNode[];
}

export function FolderTree({
  folders,
  currentFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  canManageFolders = true,
}: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [creatingIn, setCreatingIn] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Build folder tree structure
  const buildTree = (folders: MediaFolder[]): FolderNode[] => {
    const map = new Map<string, FolderNode>();
    const roots: FolderNode[] = [];

    // Create nodes
    folders.forEach((folder) => {
      map.set(folder.id, { ...folder, children: [] });
    });

    // Build tree
    folders.forEach((folder) => {
      const node = map.get(folder.id)!;
      if (folder.parentId) {
        const parent = map.get(folder.parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    // Sort by name
    const sortNodes = (nodes: FolderNode[]) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name));
      nodes.forEach((node) => sortNodes(node.children));
    };
    sortNodes(roots);

    return roots;
  };

  const folderTree = buildTree(folders);

  const toggleExpanded = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !onCreateFolder) return;

    await onCreateFolder(
      newFolderName.trim(),
      creatingIn === "root" ? undefined : creatingIn || undefined
    );
    setNewFolderName("");
    setCreatingIn(null);
  };

  const handleRename = async (folderId: string) => {
    if (!renameValue.trim() || !onRenameFolder) return;
    await onRenameFolder(folderId, renameValue.trim());
    setRenamingId(null);
    setRenameValue("");
  };

  const renderFolder = (folder: FolderNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = currentFolderId === folder.id;
    const hasChildren = folder.children.length > 0;

    return (
      <div key={folder.id}>
        <div
          className={cn(
            "group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
            isSelected
              ? "bg-primary/10 text-primary"
              : "hover:bg-muted text-foreground"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {/* Expand/Collapse Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded(folder.id);
            }}
            className={cn(
              "p-0.5 rounded hover:bg-muted-foreground/10",
              !hasChildren && "invisible"
            )}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Folder Icon */}
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          ) : (
            <Folder className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          )}

          {/* Folder Name */}
          {renamingId === folder.id ? (
            <Input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => {
                setRenamingId(null);
                setRenameValue("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRename(folder.id);
                } else if (e.key === "Escape") {
                  setRenamingId(null);
                  setRenameValue("");
                }
              }}
              className="h-6 text-sm py-0 px-1"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="flex-1 truncate text-sm"
              onClick={() => onSelectFolder(folder.id)}
            >
              {folder.name}
            </span>
          )}

          {/* File Count */}
          {folder.fileCount !== undefined && folder.fileCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {folder.fileCount}
            </span>
          )}

          {/* Actions Menu */}
          {canManageFolders && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setCreatingIn(folder.id);
                    toggleExpanded(folder.id);
                  }}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Subfolder
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setRenamingId(folder.id);
                    setRenameValue(folder.name);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                {onDeleteFolder && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDeleteFolder(folder.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {folder.children.map((child) => renderFolder(child, depth + 1))}
          </div>
        )}

        {/* New Subfolder Input */}
        {creatingIn === folder.id && isExpanded && (
          <div
            className="flex items-center gap-2 px-2 py-1"
            style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
          >
            <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input
              autoFocus
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={() => {
                if (!newFolderName.trim()) {
                  setCreatingIn(null);
                  setNewFolderName("");
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateFolder();
                } else if (e.key === "Escape") {
                  setCreatingIn(null);
                  setNewFolderName("");
                }
              }}
              className="h-7 text-sm"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {/* All Files */}
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
          currentFolderId === null
            ? "bg-primary/10 text-primary"
            : "hover:bg-muted"
        )}
        onClick={() => onSelectFolder(null)}
      >
        <Folder className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">All Files</span>
      </div>

      {/* Folder Tree */}
      {folderTree.map((folder) => renderFolder(folder))}

      {/* New Root Folder Input */}
      {creatingIn === "root" && (
        <div className="flex items-center gap-2 px-2 py-1">
          <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Input
            autoFocus
            placeholder="Folder name..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onBlur={() => {
              if (!newFolderName.trim()) {
                setCreatingIn(null);
                setNewFolderName("");
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCreateFolder();
              } else if (e.key === "Escape") {
                setCreatingIn(null);
                setNewFolderName("");
              }
            }}
            className="h-7 text-sm"
          />
        </div>
      )}

      {/* Create New Folder Button */}
      {canManageFolders && onCreateFolder && !creatingIn && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => setCreatingIn("root")}
        >
          <Plus className="h-4 w-4" />
          New Folder
        </Button>
      )}
    </div>
  );
}
