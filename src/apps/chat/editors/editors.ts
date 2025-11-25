import { DLLMId } from '~/modules/llms/store-llms';
import { SystemPurposeId, SystemPurposes } from '../../../data';

import { createDMessage, DMessage, useChatStore } from '~/common/state/store-chats';


export function createAssistantTypingMessage(conversationId: string, assistantLlmLabel: DLLMId | 'prodia' | 'react-...' | string, assistantPurposeId: SystemPurposeId | undefined, text: string): string {
  const assistantMessage: DMessage = createDMessage('assistant', text);
  assistantMessage.typing = true;
  assistantMessage.purposeId = assistantPurposeId;
  assistantMessage.originLLM = assistantLlmLabel;
  useChatStore.getState().appendMessage(conversationId, assistantMessage);
  return assistantMessage.id;
}


export function updatePurposeInHistory(conversationId: string, history: DMessage[]): DMessage[] {
  const systemMessageIndex = history.findIndex(m => m.role === 'system');
  const systemMessage: DMessage = systemMessageIndex >= 0 ? history.splice(systemMessageIndex, 1)[0] : createDMessage('system', '');
  
  // Get conversation topic if it exists
  const conversation = useChatStore.getState().conversations.find(c => c.id === conversationId);
  const topic = conversation?.searchTopic;
  
  // Use system purpose message if no system message exists yet
  if (!systemMessage.updated && !systemMessage.text) {
    const { defaultSystemPurposeId } = require('../../../data') as { defaultSystemPurposeId: SystemPurposeId };
    const purpose = SystemPurposes[defaultSystemPurposeId as SystemPurposeId];
    console.log('[Chat] updatePurposeInHistory: setting system message', { defaultSystemPurposeId, hasPurpose: !!purpose, topic });
    if (purpose) {
      let systemPrompt = purpose.systemMessage.replaceAll('{{Today}}', new Date().toISOString().split('T')[0]);
      
      // Add topic to system prompt if it exists
      if (topic) {
        systemPrompt = `Conversation Topic: ${topic}\n\n${systemPrompt}`;
      }
      
      systemMessage.text = systemPrompt;
      systemMessage.purposeId = defaultSystemPurposeId;
      console.log('[Chat] updatePurposeInHistory: system message set', { textLength: systemMessage.text.length, purposeId: systemMessage.purposeId, hasTopic: !!topic });
    } else {
      // Fallback to FALLBACK_SYSTEM_PROMPT if purpose not found
      const { FALLBACK_SYSTEM_PROMPT } = require('~/conversational-search.config');
      let systemPrompt = FALLBACK_SYSTEM_PROMPT.replaceAll('{{Today}}', new Date().toISOString().split('T')[0]);
      
      // Add topic to system prompt if it exists
      if (topic) {
        systemPrompt = `Conversation Topic: ${topic}\n\n${systemPrompt}`;
      }
      
      systemMessage.text = systemPrompt;
      console.log('[Chat] updatePurposeInHistory: using fallback system prompt', { hasTopic: !!topic });
    }
  } else {
    // If system message already exists, check if we need to update it with topic
    if (topic && systemMessage.text && !systemMessage.text.includes(topic)) {
      // Only update if topic is not already in the system message
      systemMessage.text = `Conversation Topic: ${topic}\n\n${systemMessage.text}`;
      console.log('[Chat] updatePurposeInHistory: added topic to existing system message');
    }
    console.log('[Chat] updatePurposeInHistory: system message already exists', { hasText: !!systemMessage.text, hasUpdated: !!systemMessage.updated });
  }
  
  history.unshift(systemMessage);
  // Don't call setMessages here as it will abort the current request
  // The history will be updated when the assistant message is streamed
  return history;
}