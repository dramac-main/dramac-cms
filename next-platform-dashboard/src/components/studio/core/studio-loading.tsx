/**
 * Studio Loading State
 * 
 * Displayed while the studio editor is loading.
 */

import { Loader2 } from "lucide-react";

export function StudioLoading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {/* Logo/Brand */}
        <div className="text-2xl font-bold text-primary">DRAMAC Studio</div>
        
        {/* Loading spinner */}
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        
        {/* Loading text */}
        <p className="text-sm text-muted-foreground">Loading editor...</p>
      </div>
    </div>
  );
}
