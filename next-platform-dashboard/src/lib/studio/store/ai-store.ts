/**
 * DRAMAC Studio AI Store
 * 
 * Manages AI chat state, conversation history, and pending changes.
 * Phase STUDIO-11: AI Component Chat
 */

import { create } from "zustand";
import { nanoid } from "nanoid";

// =============================================================================
// TYPES
// =============================================================================

export interface ChatMessage {
  /** Unique message ID */
  id: string;
  
  /** Message role */
  role: "user" | "assistant" | "system";
  
  /** Message content */
  content: string;
  
  /** Timestamp */
  timestamp: Date;
  
  /** Proposed prop changes (assistant messages only) */
  proposedChanges?: Record<string, unknown>;
  
  /** Explanation of changes (assistant messages only) */
  explanation?: string;
  
  /** Error message if AI request failed */
  error?: string;
  
  /** Is this message still loading? */
  isLoading?: boolean;
}

export interface AIState {
  /** Is chat panel open */
  isOpen: boolean;
  
  /** Currently active component ID */
  activeComponentId: string | null;
  
  /** Chat history for current component */
  chatHistory: ChatMessage[];
  
  /** Pending changes awaiting user approval */
  pendingChanges: Record<string, unknown> | null;
  
  /** Pending changes explanation */
  pendingExplanation: string | null;
  
  /** Is AI request in progress */
  isLoading: boolean;
  
  /** Error message */
  error: string | null;
}

export interface AIActions {
  /** Open chat for a specific component */
  openChat: (componentId: string) => void;
  
  /** Close chat panel */
  closeChat: () => void;
  
  /** Toggle chat open/closed */
  toggleChat: (componentId: string) => void;
  
  /** Send a message to AI - tracking state only, actual call done by component */
  sendMessage: (message: string) => Promise<void>;
  
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  
  /** Add message to history */
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  
  /** Update last message (for streaming or corrections) */
  updateLastMessage: (updates: Partial<ChatMessage>) => void;
  
  /** Set pending changes from AI response */
  setPendingChanges: (changes: Record<string, unknown> | null, explanation?: string) => void;
  
  /** Apply pending changes to component - store just tracks, actual update done by component */
  applyChanges: () => void;
  
  /** Reject pending changes */
  rejectChanges: () => void;
  
  /** Clear chat history */
  clearHistory: () => void;
  
  /** Set error */
  setError: (error: string | null) => void;
}

export type AIStore = AIState & AIActions;

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: AIState = {
  isOpen: false,
  activeComponentId: null,
  chatHistory: [],
  pendingChanges: null,
  pendingExplanation: null,
  isLoading: false,
  error: null,
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useAIStore = create<AIStore>()((set, get) => ({
  ...initialState,

  openChat: (componentId: string) => {
    const { activeComponentId } = get();
    
    // If switching components, clear history
    if (activeComponentId !== componentId) {
      set({
        isOpen: true,
        activeComponentId: componentId,
        chatHistory: [],
        pendingChanges: null,
        pendingExplanation: null,
        error: null,
      });
    } else {
      set({ isOpen: true });
    }
  },

  closeChat: () => {
    set({ 
      isOpen: false,
      pendingChanges: null,
      pendingExplanation: null,
    });
  },

  toggleChat: (componentId: string) => {
    const { isOpen, activeComponentId, openChat, closeChat } = get();
    
    if (isOpen && activeComponentId === componentId) {
      closeChat();
    } else {
      openChat(componentId);
    }
  },

  sendMessage: async (_message: string) => {
    // Implementation delegated to component - store just tracks state
    // The component will call addMessage, setLoading, etc.
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  addMessage: (message) => {
    const newMessage: ChatMessage = {
      ...message,
      id: nanoid(),
      timestamp: new Date(),
    };
    
    set((state) => ({
      chatHistory: [...state.chatHistory, newMessage],
    }));
  },

  updateLastMessage: (updates) => {
    set((state) => {
      const history = [...state.chatHistory];
      if (history.length > 0) {
        history[history.length - 1] = {
          ...history[history.length - 1],
          ...updates,
        };
      }
      return { chatHistory: history };
    });
  },

  setPendingChanges: (changes, explanation) => {
    set({
      pendingChanges: changes,
      pendingExplanation: explanation || null,
    });
  },

  applyChanges: () => {
    // Store just clears pending - actual application done by component
    // with access to editor store
    set({
      pendingChanges: null,
      pendingExplanation: null,
    });
  },

  rejectChanges: () => {
    const { addMessage, pendingChanges } = get();
    
    if (pendingChanges) {
      addMessage({
        role: "system",
        content: "Changes rejected by user.",
      });
    }
    
    set({
      pendingChanges: null,
      pendingExplanation: null,
    });
  },

  clearHistory: () => {
    set({
      chatHistory: [],
      pendingChanges: null,
      pendingExplanation: null,
      error: null,
    });
  },

  setError: (error) => {
    set({ error, isLoading: false });
  },
}));

// =============================================================================
// SELECTOR HOOKS
// =============================================================================

/** Check if chat is open for a specific component */
export const useIsAIChatOpen = (componentId: string) => 
  useAIStore((s) => s.isOpen && s.activeComponentId === componentId);

/** Get chat history */
export const useChatHistory = () => useAIStore((s) => s.chatHistory);

/** Get pending changes */
export const usePendingChanges = () => useAIStore((s) => ({
  changes: s.pendingChanges,
  explanation: s.pendingExplanation,
}));

/** Check if AI is loading */
export const useAILoading = () => useAIStore((s) => s.isLoading);

/** Get AI chat open state */
export const useAIChatOpen = () => useAIStore((s) => s.isOpen);

/** Get active component ID for AI chat */
export const useAIActiveComponentId = () => useAIStore((s) => s.activeComponentId);
