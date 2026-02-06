"use client";

import { useEffect, useState } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error }: GlobalErrorProps) {
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  // Check if it's a ChunkLoadError (happens after deployments when browser has stale cache)
  const isChunkLoadError = error.name === "ChunkLoadError" || 
                           error.message?.includes("ChunkLoadError") ||
                           error.message?.includes("Failed to load chunk") ||
                           error.message?.includes("Loading chunk");

  useEffect(() => {
    console.error("Global error:", error);
    
    // Auto-refresh for ChunkLoadError
    if (isChunkLoadError) {
      const refreshKey = "global_chunk_error_refresh";
      const lastRefresh = sessionStorage.getItem(refreshKey);
      const now = Date.now();
      
      if (!lastRefresh || now - parseInt(lastRefresh) > 10000) {
        setIsAutoRefreshing(true);
        sessionStorage.setItem(refreshKey, now.toString());
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    }
  }, [error, isChunkLoadError]);

  return (
    <html>
      <body>
        <div style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          fontFamily: "system-ui, -apple-system, sans-serif",
          backgroundColor: "#0a0a0b",
          color: "#fafafa"
        }}>
          <div style={{
            maxWidth: "28rem",
            width: "100%",
            padding: "2rem",
            borderRadius: "0.75rem",
            backgroundColor: "#18181b",
            border: "1px solid #27272a",
            textAlign: "center"
          }}>
            <div style={{
              width: "4rem",
              height: "4rem",
              margin: "0 auto 1rem",
              borderRadius: "50%",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#ef4444" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            
            <h1 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "0.5rem" }}>
              Something went wrong!
            </h1>
            
            <p style={{ color: "#a1a1aa", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
              {isChunkLoadError
                ? isAutoRefreshing 
                  ? "Refreshing to load the latest version..."
                  : "A new version was deployed. Please refresh the page."
                : "An unexpected error occurred while loading this page."}
            </p>
            
            {isChunkLoadError && isAutoRefreshing && (
              <p style={{ color: "#71717a", fontSize: "0.75rem", marginBottom: "1rem" }}>
                Please wait while we refresh the page...
              </p>
            )}
            
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => window.location.reload()}
                disabled={isAutoRefreshing}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #27272a",
                  backgroundColor: "transparent",
                  color: "#fafafa",
                  cursor: isAutoRefreshing ? "not-allowed" : "pointer",
                  opacity: isAutoRefreshing ? 0.5 : 1,
                  fontSize: "0.875rem"
                }}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ animation: isAutoRefreshing ? "spin 1s linear infinite" : "none" }}
                >
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
                  <path d="M21 3v5h-5"></path>
                </svg>
                {isAutoRefreshing ? "Refreshing..." : "Try again"}
              </button>
              
              <a
                href="/dashboard"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.375rem",
                  backgroundColor: "#8b5cf6",
                  color: "#fafafa",
                  textDecoration: "none",
                  fontSize: "0.875rem"
                }}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                Go to Dashboard
              </a>
            </div>
            
            <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", justifyContent: "center", fontSize: "0.75rem", color: "#71717a" }}>
              <button
                onClick={() => window.history.back()}
                style={{
                  background: "none",
                  border: "none",
                  color: "#71717a",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem"
                }}
              >
                ← Go back
              </button>
              <span>•</span>
              <a href="/support" style={{ color: "#71717a", textDecoration: "none" }}>
                Contact Support
              </a>
            </div>
          </div>
          
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </body>
    </html>
  );
}
