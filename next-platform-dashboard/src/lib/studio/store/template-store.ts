/**
 * DRAMAC Studio Template Store
 * 
 * Zustand store for managing section templates.
 * Fetches templates, handles filtering by category and search.
 * 
 * Phase: STUDIO-24 Section Templates
 */

import { create } from 'zustand';
import type {
  SectionTemplate,
  TemplateCategoryInfo,
  TemplateCategory,
  TemplateStoreState,
  TemplateStoreActions,
} from '@/types/studio-templates';
import { TEMPLATE_CATEGORIES } from '@/types/studio-templates';
import { STARTER_TEMPLATES } from '../data/starter-templates';

// =============================================================================
// TYPES
// =============================================================================

interface TemplateStore extends TemplateStoreState, TemplateStoreActions {}

// =============================================================================
// STORE
// =============================================================================

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  // State
  templates: [],
  categories: TEMPLATE_CATEGORIES,
  selectedCategory: 'all',
  searchQuery: '',
  isLoading: false,
  error: null,

  // Actions
  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // For now, use starter templates from local data
      // Later: fetch from Supabase
      // const { data, error } = await supabase
      //   .from('studio_templates')
      //   .select('*')
      //   .order('category', { ascending: true });
      
      // Simulate API delay for now
      await new Promise(resolve => setTimeout(resolve, 100));
      
      set({
        templates: STARTER_TEMPLATES,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch templates',
        isLoading: false,
      });
    }
  },

  setCategory: (category) => {
    set({ selectedCategory: category });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  getFilteredTemplates: () => {
    const { templates, selectedCategory, searchQuery } = get();
    
    let filtered = templates;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  },

  getTemplateById: (id) => {
    return get().templates.find(t => t.id === id);
  },
}));

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook for filtered templates with auto-update
 */
export function useFilteredTemplates() {
  const templates = useTemplateStore(state => state.templates);
  const selectedCategory = useTemplateStore(state => state.selectedCategory);
  const searchQuery = useTemplateStore(state => state.searchQuery);
  const getFilteredTemplates = useTemplateStore(state => state.getFilteredTemplates);
  
  // Re-compute when dependencies change
  return getFilteredTemplates();
}
