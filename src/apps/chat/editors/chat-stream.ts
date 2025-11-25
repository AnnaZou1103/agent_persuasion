import { SystemPurposeId } from '../../../data';
import { DLLMId } from '~/modules/llms/store-llms';
import { autoSuggestions } from '~/modules/aifn/autosuggestions/autoSuggestions';
import { autoTitle } from '~/modules/aifn/autotitle/autoTitle';
import { speakText } from '~/modules/elevenlabs/elevenlabs.client';
import { streamChat } from '~/modules/llms/transports/streamChat';
import { useElevenlabsStore } from '~/modules/elevenlabs/store-elevenlabs';

import { DMessage, useChatStore } from '~/common/state/store-chats';

import { createAssistantTypingMessage, updatePurposeInHistory } from './editors';


/**
 * The main "chat" function. TODO: this is here so we can soon move it to the data model.
 */
export async function runAssistantUpdatingState(conversationId: string, history: DMessage[], assistantLlmId: DLLMId, _autoTitle: boolean, enableFollowUps: boolean) {
  console.log('[Chat] runAssistantUpdatingState called', { conversationId, historyLength: history.length, assistantLlmId });

  // Create a blank and 'typing' message for the assistant IMMEDIATELY
  const assistantMessageId = createAssistantTypingMessage(conversationId, assistantLlmId, undefined, '');

  // When an abort controller is set, the UI switches to the "stop" mode
  const controller = new AbortController();
  const { startTyping, editMessage, setMessages } = useChatStore.getState();
  startTyping(conversationId, controller);

  // Use normal system message update (no search enhancement)
  const enhancedHistory = updatePurposeInHistory(conversationId, history);
  console.log('[Chat] Enhanced history', { length: enhancedHistory.length, systemMessage: enhancedHistory[0] });

  // Ensure system message is saved to conversation.messages
  // We'll save it after the stream completes to avoid interfering with the streaming
  // Store the system message for later use
  const systemMessageToSave = enhancedHistory[0]?.role === 'system' ? enhancedHistory[0] : null;

  // Update the assistant message purpose
  if (enhancedHistory[0]?.purposeId) {
    editMessage(conversationId, assistantMessageId, { purposeId: enhancedHistory[0].purposeId }, false);
  }

  // stream the assistant's messages
  console.log('[Chat] Starting streamAssistantMessage');
  await streamAssistantMessage(assistantLlmId, enhancedHistory, controller.signal, (updatedMessage) => {
    console.log('[Chat] Stream update', updatedMessage);
    editMessage(conversationId, assistantMessageId, updatedMessage, false);
  });

  // clear to send, again
  startTyping(conversationId, null);

  // Save system message to conversation.messages after streaming is complete
  if (systemMessageToSave) {
    const conversation = useChatStore.getState().conversations.find(c => c.id === conversationId);
    if (conversation) {
      const hasSystemMessage = conversation.messages.some(msg => msg.role === 'system');
      
      if (!hasSystemMessage) {
        // Add system message to conversation.messages if it doesn't exist
        const currentMessages = conversation.messages;
        const messagesWithSystem = [systemMessageToSave, ...currentMessages];
        setMessages(conversationId, messagesWithSystem);
        console.log('[Chat] Added system message to conversation.messages after streaming', { 
          systemMessageText: systemMessageToSave.text.substring(0, 50),
          totalMessages: messagesWithSystem.length
        });
      } else {
        // Update existing system message if needed
        const existingSystemIndex = conversation.messages.findIndex(msg => msg.role === 'system');
        if (existingSystemIndex >= 0 && conversation.messages[existingSystemIndex].text !== systemMessageToSave.text) {
          const updatedMessages = [...conversation.messages];
          updatedMessages[existingSystemIndex] = systemMessageToSave;
          setMessages(conversationId, updatedMessages);
          console.log('[Chat] Updated system message in conversation.messages after streaming');
        }
      }
    }
  }

  // auto-suggestions
  if (enableFollowUps)
    await autoSuggestions(conversationId, assistantMessageId);

  // update text, if needed
  if (_autoTitle)
    await autoTitle(conversationId);
}


async function streamAssistantMessage(
  llmId: DLLMId, history: DMessage[],
  abortSignal: AbortSignal,
  editMessage: (updatedMessage: Partial<DMessage>) => void,
) {

  // TTS: speak the first line, if configured
  const speakFirstLine = useElevenlabsStore.getState().elevenLabsAutoSpeak === 'firstLine';
  let firstLineSpoken = false;

  try {
    const messages = history.map(({ role, text }) => ({ role, content: text }));
    console.log('[Chat] streamAssistantMessage: sending messages to LLM', { llmId, messageCount: messages.length, messages });
    await streamChat(llmId, messages, abortSignal, (updatedMessage: Partial<DMessage>) => {
      // update the message in the store (and thus schedule a re-render)
      editMessage(updatedMessage);

      // 📢 TTS
      if (updatedMessage?.text && speakFirstLine && !firstLineSpoken) {
        let cutPoint = updatedMessage.text.lastIndexOf('\n');
        if (cutPoint < 0)
          cutPoint = updatedMessage.text.lastIndexOf('. ');
        if (cutPoint > 100 && cutPoint < 400) {
          firstLineSpoken = true;
          const firstParagraph = updatedMessage.text.substring(0, cutPoint);
          speakText(firstParagraph).then(() => false /* fire and forget, we don't want to stall this loop */);
        }
      }
    });
    console.log('[Chat] streamAssistantMessage: completed successfully');
  } catch (error: any) {
    if (error?.name !== 'AbortError') {
      console.error('[Chat] streamAssistantMessage: Fetch request error:', error);
      // TODO: show an error to the UI?
    } else {
      console.log('[Chat] streamAssistantMessage: Aborted');
    }
  }

  // finally, stop the typing animation
  editMessage({ typing: false });
}