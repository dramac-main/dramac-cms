/**
 * DRAMAC Studio History Panel
 * 
 * Combined history timeline and snapshots panel.
 * Created in PHASE-STUDIO-17.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  History, 
  Camera, 
  RotateCcw, 
  RotateCw, 
  Trash2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useEditorStore, useHistoryState, undo, redo } from '@/lib/studio/store';
import { useHistoryStore } from '@/lib/studio/store/history-store';
import { useSnapshotStore } from '@/lib/studio/store/snapshot-store';
import { HistoryEntryRow } from './history-entry';
import { SnapshotRow } from './snapshot-row';
import { SaveSnapshotDialog } from './save-snapshot-dialog';
import { ComparisonDialog } from './comparison-dialog';
import type { SnapshotDiff } from '@/types/studio-history';

// =============================================================================
// PROPS
// =============================================================================

interface HistoryPanelProps {
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function HistoryPanel({ className }: HistoryPanelProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [comparisonDiff, setComparisonDiff] = useState<SnapshotDiff | null>(null);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  
  const data = useEditorStore((s) => s.data);
  const setData = useEditorStore((s) => s.setData);
  const pageId = useEditorStore((s) => s.pageId);
  const siteId = useEditorStore((s) => s.siteId);
  
  const { canUndo, canRedo } = useHistoryState();
  
  const { 
    entries, 
    currentIndex, 
    jumpToEntry, 
    clearHistory,
    getUndoDescription,
    getRedoDescription,
  } = useHistoryStore();
  
  const {
    snapshots,
    isLoading,
    setContext,
    loadSnapshots,
    saveSnapshot,
    restoreSnapshot,
    deleteSnapshot,
    compareToCurrent,
  } = useSnapshotStore();
  
  // Set snapshot context and load on mount
  useEffect(() => {
    if (pageId && siteId) {
      setContext(pageId, siteId);
      loadSnapshots();
    }
  }, [pageId, siteId, setContext, loadSnapshots]);
  
  // Handlers
  const handleUndo = useCallback(() => {
    undo();
    toast.success('Undone');
  }, []);
  
  const handleRedo = useCallback(() => {
    redo();
    toast.success('Redone');
  }, []);
  
  const handleJumpToEntry = useCallback((entryId: string) => {
    const restoredData = jumpToEntry(entryId);
    if (restoredData) {
      setData(restoredData);
      toast.success('Jumped to history point');
    }
  }, [jumpToEntry, setData]);
  
  const handleSaveSnapshot = useCallback(async (name: string, description?: string) => {
    try {
      await saveSnapshot(name, data, description);
      toast.success('Snapshot saved');
    } catch (error) {
      toast.error('Failed to save snapshot');
    }
  }, [saveSnapshot, data]);
  
  const handleRestoreSnapshot = useCallback((id: string) => {
    const restoredData = restoreSnapshot(id);
    if (restoredData) {
      setData(restoredData);
      toast.success('Snapshot restored');
    }
  }, [restoreSnapshot, setData]);
  
  const handleDeleteSnapshot = useCallback(async () => {
    if (!deleteConfirmId) return;
    
    try {
      await deleteSnapshot(deleteConfirmId);
      toast.success('Snapshot deleted');
    } catch (error) {
      toast.error('Failed to delete snapshot');
    } finally {
      setDeleteConfirmId(null);
    }
  }, [deleteConfirmId, deleteSnapshot]);
  
  const handleCompareSnapshot = useCallback((id: string) => {
    const diff = compareToCurrent(id, data);
    if (diff) {
      setComparisonDiff(diff);
      setComparisonOpen(true);
    }
  }, [compareToCurrent, data]);

  const handleClearHistory = useCallback(() => {
    clearHistory();
    toast.success('History cleared');
  }, [clearHistory]);
  
  const undoDescription = getUndoDescription();
  const redoDescription = getRedoDescription();
  
  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      <Tabs defaultValue="history" className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <TabsList className="h-8">
            <TabsTrigger value="history" className="text-xs px-3">
              <History className="h-3.5 w-3.5 mr-1.5" />
              History
            </TabsTrigger>
            <TabsTrigger value="snapshots" className="text-xs px-3">
              <Camera className="h-3.5 w-3.5 mr-1.5" />
              Snapshots
            </TabsTrigger>
          </TabsList>
          
          <TooltipProvider>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleUndo}
                    disabled={!canUndo}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {canUndo && undoDescription ? `Undo: ${undoDescription}` : 'Nothing to undo'}
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleRedo}
                    disabled={!canRedo}
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {canRedo && redoDescription ? `Redo: ${redoDescription}` : 'Nothing to redo'}
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
        
        <TabsContent value="history" className="flex-1 mt-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <History className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No history yet</p>
                  <p className="text-xs mt-1">Changes will appear here</p>
                </div>
              ) : (
                <>
                  {entries.slice().reverse().map((entry, reverseIndex) => {
                    const actualIndex = entries.length - 1 - reverseIndex;
                    return (
                      <HistoryEntryRow
                        key={entry.id}
                        entry={entry}
                        isCurrent={actualIndex === currentIndex}
                        onClick={() => handleJumpToEntry(entry.id)}
                      />
                    );
                  })}
                  
                  <div className="pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground"
                      onClick={handleClearHistory}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Clear History
                    </Button>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="snapshots" className="flex-1 mt-0 data-[state=inactive]:hidden flex flex-col">
          <div className="p-2 border-b">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setSaveDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Save Current State
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading snapshots...
                </div>
              ) : snapshots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Camera className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No snapshots yet</p>
                  <p className="text-xs mt-1">Save important states to restore later</p>
                </div>
              ) : (
                snapshots.map((snapshot) => (
                  <SnapshotRow
                    key={snapshot.id}
                    snapshot={snapshot}
                    onRestore={() => handleRestoreSnapshot(snapshot.id)}
                    onDelete={() => setDeleteConfirmId(snapshot.id)}
                    onCompare={() => handleCompareSnapshot(snapshot.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
      
      {/* Save Snapshot Dialog */}
      <SaveSnapshotDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveSnapshot}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!deleteConfirmId} 
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Snapshot?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The snapshot will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSnapshot}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Comparison Dialog */}
      <ComparisonDialog
        open={comparisonOpen}
        onOpenChange={setComparisonOpen}
        diff={comparisonDiff}
        title="Compare to Current"
      />
    </div>
  );
}
