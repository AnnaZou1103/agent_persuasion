/**
 * Integration layer between Conversational Search and Chat System
 */

import { DMessage } from '~/common/state/store-chats';
import { useConversationalSearchStore } from './store-conversational-search';
import { SystemPurposeId } from '~/data';
import { DLLMId } from '~/modules/llms/store-llms';
import { 
  determineConversationAction,
  generateSystemPrompt,
} from './conversational-search';

/**
 * Process user message with conversational search using new framework
 * Returns enhanced system message if search is enabled
 */
export async function processUserMessageWithSearch(
  userMessage: string,
  history: DMessage[],
  llmId?: DLLMId
): Promise<{
  shouldEnhance: boolean;
  enhancedSystemMessage?: string;
  originalSystemMessage?: string;
  context?: any[];
  actionTaken?: {
    searched: boolean;
    askedClarification: boolean;
    providedSuggestion: boolean;
  };
}> {
  const searchStore = useConversationalSearchStore.getState();
  
  // Check if conversational search is enabled and initialized
  if (!searchStore.isEnabled || !searchStore.searchState) {
    return { shouldEnhance: false };
  }

  try {
    const state = searchStore.searchState;
    
    // Step 1: Determine conversation action based on strategy
    const action = await determineConversationAction(userMessage, state, llmId);
    
    console.log('[Conversation Framework] Action determined:', {
      strategy: state.strategy,
      shouldSearch: action.shouldSearch,
      shouldAskClarification: action.shouldAskClarification,
      shouldProvideSuggestion: action.shouldProvideSuggestion,
    });

    let systemPrompt: string;
    let context: any[] = [];
    let actionTaken = {
      searched: false,
      askedClarification: false,
      providedSuggestion: false,
    };

    // Step 2: Execute action
    if (action.shouldSearch) {
      // Perform RAG search
      const searchResult = await searchStore.performSearch(userMessage);
      systemPrompt = searchResult.systemPrompt;
      context = searchResult.context || [];
      actionTaken.searched = true;
    } else {
      // Generate system prompt without search (for clarification or when search not needed)
      systemPrompt = generateSystemPrompt(state, []);
      actionTaken.askedClarification = action.shouldAskClarification;
      actionTaken.providedSuggestion = action.shouldProvideSuggestion;
    }

    // Get original system message from history if exists
    const originalSystemMessage = history.find(msg => msg.role === 'system')?.text;

    return {
      shouldEnhance: true,
      enhancedSystemMessage: systemPrompt,
      originalSystemMessage,
      context,
      actionTaken,
    };
  } catch (error) {
    console.error('Error in conversational search:', error);
    return { shouldEnhance: false };
  }
}

/**
 * Update conversational search history after assistant response
 */
export function updateSearchHistory(
  userMessage: string,
  assistantResponse: string,
  actionTaken?: {
    searched: boolean;
    askedClarification: boolean;
    providedSuggestion: boolean;
  },
  retrievedContext?: any[]
): void {
  const searchStore = useConversationalSearchStore.getState();
  
  if (searchStore.isEnabled && searchStore.searchState) {
    searchStore.updateHistory(userMessage, assistantResponse, actionTaken, retrievedContext);
  }
}

/**
 * Create or update system message with search context
 */
export function prepareHistoryWithSearchContext(
  history: DMessage[],
  enhancedSystemMessage: string
): DMessage[] {
  // Find existing system message
  const systemMessageIndex = history.findIndex(msg => msg.role === 'system');
  
  // Create new system message with search context
  const systemMessage: DMessage = {
    id: systemMessageIndex >= 0 ? history[systemMessageIndex].id : 'system-search',
    text: enhancedSystemMessage,
    sender: 'Bot',
    avatar: null,
    typing: false,
    role: 'system',
    tokenCount: 0,
    created: Date.now(),
    updated: Date.now(),
  };

  // Replace or add system message
  if (systemMessageIndex >= 0) {
    return [
      ...history.slice(0, systemMessageIndex),
      systemMessage,
      ...history.slice(systemMessageIndex + 1),
    ];
  } else {
    return [systemMessage, ...history];
  }
}

