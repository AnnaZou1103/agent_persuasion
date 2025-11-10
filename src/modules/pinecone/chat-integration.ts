/**
 * Integration layer between Conversational Search and Chat System
 */

import { DMessage } from '~/common/state/store-chats';
import { useConversationalSearchStore } from './store-conversational-search';
import { SystemPurposeId } from '~/data';

/**
 * Process user message with conversational search
 * Returns enhanced system message if search is enabled
 */
export async function processUserMessageWithSearch(
  userMessage: string,
  history: DMessage[]
): Promise<{
  shouldEnhance: boolean;
  enhancedSystemMessage?: string;
  originalSystemMessage?: string;
}> {
  const searchStore = useConversationalSearchStore.getState();
  
  // Check if conversational search is enabled and initialized
  if (!searchStore.isEnabled || !searchStore.searchState) {
    return { shouldEnhance: false };
  }

  try {
    // Perform search and get system prompt with context
    const { systemPrompt } = await searchStore.performSearch(userMessage);
    
    // Get original system message from history if exists
    const originalSystemMessage = history.find(msg => msg.role === 'system')?.text;

    return {
      shouldEnhance: true,
      enhancedSystemMessage: systemPrompt,
      originalSystemMessage,
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
  assistantResponse: string
): void {
  const searchStore = useConversationalSearchStore.getState();
  
  if (searchStore.isEnabled && searchStore.searchState) {
    searchStore.updateHistory(userMessage, assistantResponse);
  }
}

/**
 * Create or update system message with search context
 */
export function prepareHistoryWithSearchContext(
  history: DMessage[],
  enhancedSystemMessage: string,
  purposeId: SystemPurposeId
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
    purposeId: purposeId,
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

