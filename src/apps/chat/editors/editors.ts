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
  
  // Use fallback system prompt if no system message exists yet
  if (!systemMessage.updated && !systemMessage.text) {
    const { FALLBACK_SYSTEM_PROMPT } = require('~/conversational-search.config');
    systemMessage.text = FALLBACK_SYSTEM_PROMPT.replaceAll('{{Today}}', new Date().toISOString().split('T')[0]);
  }
  
  history.unshift(systemMessage);
  useChatStore.getState().setMessages(conversationId, history);
  return history;
}