/**
 * Zustand store for Conversational Search state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ConversationalSearchState,
  ConversationStrategy,
  Standpoint,
  PineconeSnippet,
} from './pinecone.types';
import {
  initializeSearchState,
  retrieveContextForQuery,
  generateSystemPrompt,
  updateSearchState,
} from './conversational-search';
import { CONVERSATIONAL_SEARCH_DEFAULTS } from '~/conversational-search.config';

interface ConversationalSearchStore {
  // State
  isEnabled: boolean;
  searchState: ConversationalSearchState | null;
  isLoading: boolean;
  error: string | null;
  
  // Configuration
  topK: number;
  snippetSize: number;

  // Actions
  setEnabled: (enabled: boolean) => void;
  initializeSearch: (topic: string, standpoint: Standpoint, strategy: ConversationStrategy) => void;
  resetSearch: () => void;
  setConfiguration: (topK?: number, snippetSize?: number) => void;
  
  // Search operations
  performSearch: (query: string) => Promise<{
    systemPrompt: string;
    context: PineconeSnippet[];
  }>;
  updateHistory: (
    userQuery: string, 
    assistantResponse: string,
    actionTaken?: {
      searched: boolean;
      askedClarification: boolean;
      providedSuggestion: boolean;
    },
    retrievedContext?: PineconeSnippet[]
  ) => void;
  
  // Getters
  getSystemPrompt: () => string | null;
  getCurrentTopic: () => string | null;
  getCurrentStandpoint: () => Standpoint | null;
  getCurrentStrategy: () => ConversationStrategy | null;
}

export const useConversationalSearchStore = create<ConversationalSearchStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isEnabled: CONVERSATIONAL_SEARCH_DEFAULTS.enabledByDefault,
      searchState: CONVERSATIONAL_SEARCH_DEFAULTS.enabledByDefault && CONVERSATIONAL_SEARCH_DEFAULTS.defaultTopic
        ? initializeSearchState(
            CONVERSATIONAL_SEARCH_DEFAULTS.defaultTopic,
            CONVERSATIONAL_SEARCH_DEFAULTS.defaultStandpoint,
            CONVERSATIONAL_SEARCH_DEFAULTS.defaultStrategy
          )
        : null,
      isLoading: false,
      error: null,
      topK: CONVERSATIONAL_SEARCH_DEFAULTS.defaultTopK,
      snippetSize: CONVERSATIONAL_SEARCH_DEFAULTS.defaultSnippetSize,

      // Actions
      setEnabled: (enabled: boolean) => {
        set({ isEnabled: enabled });
        if (!enabled) {
          set({ searchState: null, error: null });
        }
      },

      initializeSearch: (topic: string, standpoint: Standpoint, strategy: ConversationStrategy) => {
        const searchState = initializeSearchState(topic, standpoint, strategy);
        set({ searchState, error: null });
      },

      resetSearch: () => {
        set({ searchState: null, error: null, isLoading: false });
      },

      setConfiguration: (topK?: number, snippetSize?: number) => {
        const updates: Partial<ConversationalSearchStore> = {};
        if (topK !== undefined) updates.topK = topK;
        if (snippetSize !== undefined) updates.snippetSize = snippetSize;
        set(updates);
      },

      performSearch: async (query: string) => {
        const { searchState, topK, snippetSize } = get();
        
        if (!searchState) {
          throw new Error('Search state not initialized. Call initializeSearch first.');
        }

        set({ isLoading: true, error: null });

        try {
          // Retrieve context
          const context = await retrieveContextForQuery(
            query,
            searchState,
            topK,
            snippetSize
          );

          // Generate system prompt with context
          const systemPrompt = generateSystemPrompt(searchState, context);

          // Update state with retrieved context
          set({
            searchState: {
              ...searchState,
              lastRetrievedContext: context,
            },
            isLoading: false,
          });

          return { systemPrompt, context };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      updateHistory: (
        userQuery: string, 
        assistantResponse: string,
        actionTaken?: {
          searched: boolean;
          askedClarification: boolean;
          providedSuggestion: boolean;
        },
        retrievedContext?: PineconeSnippet[]
      ) => {
        const { searchState } = get();
        if (!searchState) return;

        const updatedState = updateSearchState(
          searchState,
          userQuery,
          assistantResponse,
          retrievedContext || searchState.lastRetrievedContext,
          actionTaken
        );

        set({ searchState: updatedState });
      },

      // Getters
      getSystemPrompt: () => {
        const { searchState } = get();
        if (!searchState || !searchState.lastRetrievedContext) return null;
        return generateSystemPrompt(searchState, searchState.lastRetrievedContext);
      },

      getCurrentTopic: () => {
        const { searchState } = get();
        return searchState?.topic || null;
      },

      getCurrentStandpoint: () => {
        const { searchState } = get();
        return searchState?.standpoint || null;
      },

      getCurrentStrategy: () => {
        const { searchState } = get();
        return searchState?.strategy || null;
      },
    }),
    {
      name: 'conversational-search-store',
      partialize: (state) => ({
        isEnabled: state.isEnabled,
        topK: state.topK,
        snippetSize: state.snippetSize,
        // Don't persist searchState as it contains runtime data
      }),
    }
  )
);

