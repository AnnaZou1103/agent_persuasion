/**
 * RAG Trigger Rules
 * Determines when to trigger RAG search based on user input and conversation state
 * Uses LLM for semantic understanding when available, falls back to keyword matching
 */

import { DLLMId } from '~/modules/llms/store-llms';
import { callChatGenerate } from '~/modules/llms/transports/chatGenerate';

/**
 * Use LLM to determine if RAG search should be triggered
 */
async function shouldTriggerRAGWithLLM(
  userMessage: string,
  topic: string,
  strategy: 'suggestion' | 'clarification',
  clarificationState: {
    isAwaitingClarification: boolean;
    isReadyForSearch: boolean;
  } | undefined,
  needsFactualSupport: boolean,
  llmId: DLLMId
): Promise<boolean> {
  // Build strategy-specific rules
  let strategyRules = '';
  if (strategy === 'clarification' && clarificationState) {
    if (clarificationState.isAwaitingClarification && !clarificationState.isReadyForSearch) {
      // Critical rule: If awaiting clarification and not ready, don't search yet
      strategyRules = `
CRITICAL RULE FOR CLARIFICATION STRATEGY:
- The system is currently AWAITING clarification response from the user
- The user has NOT yet expressed readiness for search
- DO NOT trigger search in this state UNLESS the user explicitly asks for evidence/data
- If user just answers clarification questions without asking for evidence, return false
- Only trigger if user explicitly requests evidence, data, or research`;
    } else if (clarificationState.isReadyForSearch) {
      strategyRules = `
CLARIFICATION STRATEGY STATE:
- User has answered clarification questions OR expressed need for search
- System is ready to proceed with search
- You can now trigger search based on the general conditions below`;
    } else {
      strategyRules = `
CLARIFICATION STRATEGY STATE:
- System has not yet asked clarification questions
- Should ask clarification first before searching
- Only trigger search if user explicitly asks for evidence/data`;
    }
  } else if (strategy === 'suggestion') {
    strategyRules = `
SUGGESTION STRATEGY:
- System should provide suggestions early
- Trigger search if user asks questions or system needs factual support
${needsFactualSupport ? '- System currently needs factual support' : ''}`;
  }

  const triggerConditions = `
TRIGGER CONDITIONS (Search if ANY condition is met):
1. User explicitly asks for evidence, data, research, sources, statistics, studies, etc.
2. User expresses uncertainty ("I'm not sure", "I don't know", "What data exists", "I'm unclear about...")
3. System needs factual support to sustain its standpoint

DO NOT TRIGGER SEARCH in these cases:
1. User expresses a clear personal opinion that doesn't need evidence (e.g., "I just think X is annoying")
2. Off-topic casual chat or greetings

${strategyRules}
`;

  const prompt = `You are a conversational AI assistant that needs to determine whether to trigger RAG search to retrieve relevant documents and evidence.

Conversation Topic: ${topic}
User Message: ${userMessage}

${triggerConditions}

Please carefully analyze the user message and determine whether RAG search should be triggered.

Respond ONLY in JSON format:
{
  "shouldTrigger": true/false,
  "reason": "Brief explanation of your judgment"
}`;

  try {
    const response = await callChatGenerate(llmId, [
      {
        role: 'system',
        content: 'You are a professional conversation analysis assistant skilled at determining when information retrieval is needed. Please strictly follow the requirement to return JSON format only.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], 200); // Limit tokens for classification

    // Parse JSON response
    const content = response.content.trim();
    // Try to extract JSON from response (might be wrapped in markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      console.log('[RAG Trigger LLM] Decision:', result);
      return result.shouldTrigger === true;
    }

    // Fallback: check if response contains "true" or "false"
    if (content.toLowerCase().includes('"shouldTrigger": true') || content.toLowerCase().includes('true')) {
      return true;
    }
    if (content.toLowerCase().includes('"shouldTrigger": false') || content.toLowerCase().includes('false')) {
      return false;
    }

    // If can't parse, fallback to keyword matching
    console.warn('[RAG Trigger LLM] Failed to parse LLM response, falling back to keyword matching');
    return shouldTriggerRAGWithKeywords(userMessage, topic, strategy, clarificationState, needsFactualSupport);
  } catch (error) {
    console.error('[RAG Trigger LLM] Error calling LLM, falling back to keyword matching:', error);
    return shouldTriggerRAGWithKeywords(userMessage, topic, strategy, clarificationState, needsFactualSupport);
  }
}

/**
 * Check if user is asking for evidence
 */
function isAskingForEvidence(userMessage: string): boolean {
  const evidencePatterns = [
    /(?:show|provide|give|need|want|can|could|would|have|has).*(?:evidence|data|research|study|source|proof|support|statistics|survey|information|facts)/i,
    /(?:evidence|data|research|study|source|proof|support|statistics|survey|information|facts).*(?:show|provide|give|need|want|have|has)/i,
    /(?:what|which).*(?:evidence|data|research|study|source|proof|support|information|facts)/i,
    /(?:based on|according to|according|cite|citation|reference)/i,
    /(?:can you|could you|please).*(?:show|provide|give).*(?:evidence|data|research|study|source|proof|support|statistics|survey)/i,
  ];
  
  return evidencePatterns.some(pattern => pattern.test(userMessage));
}

/**
 * Check if user is expressing uncertainty
 */
function isExpressingUncertainty(userMessage: string): boolean {
  const uncertaintyPatterns = [
    /(?:i|we|i'm|we're).*(?:don't|do not|not).*(?:know|understand|sure|certain|clear)/i,
    /(?:don't|do not).*(?:know|understand|sure|certain|clear)/i,
    /(?:what|which|how|why).*(?:is|are|do|does|did)/i,
    /(?:uncertain|unsure|not sure|don't know|unclear|confused|unsure about)/i,
    /(?:i'm not|i am not|we're not|we are not).*(?:sure|certain|clear)/i,
    /(?:what|which|how|why).*(?:about|regarding|concerning)/i,
    /(?:tell me|explain|help me understand).*(?:what|which|how|why)/i,
  ];
  
  return uncertaintyPatterns.some(pattern => pattern.test(userMessage));
}

/**
 * Check if user is expressing a clear opinion that doesn't need evidence
 */
function isExpressingClearOpinion(userMessage: string): boolean {
  const opinionPatterns = [
    /(?:i|we).*(?:just|simply|only).*(?:think|feel|believe|want|prefer)/i,
    /(?:just|simply|only).*(?:think|feel|believe|want|prefer)/i,
    /(?:i|we).*(?:think|feel|believe).*(?:that|it|this).*(?:is|are|should|shouldn't)/i,
    /(?:i|we).*(?:don't|do not).*(?:need|want).*(?:evidence|proof|data|research)/i,
  ];
  
  return opinionPatterns.some(pattern => pattern.test(userMessage));
}

/**
 * Check if message is off-topic or casual chat
 * Uses more rigorous heuristics to determine if message is relevant to the topic
 */
export function isOffTopicOrCasual(userMessage: string, topic: string): boolean {
  const messageTrimmed = userMessage.trim();
  const messageLower = messageTrimmed.toLowerCase();
  const topicLower = topic.toLowerCase();
  
  // Extract meaningful keywords from topic (remove common stop words)
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'should', 'be', 'is', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can']);
  const topicKeywords = topicLower
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .map(word => word.replace(/[^\w]/g, '')); // Remove punctuation
  
  // If no meaningful keywords extracted, use all words
  const meaningfulKeywords = topicKeywords.length > 0 ? topicKeywords : topicLower.split(/\s+/).filter(w => w.length > 2);
  
  // Check if message contains topic-related keywords
  const hasTopicKeywords = meaningfulKeywords.some(keyword => {
    if (keyword.length < 3) return false;
    // Check for exact word match or as part of a word (but not too short)
    const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'i');
    return regex.test(messageLower);
  });
  
  // Very short messages without topic keywords are likely off-topic
  if (messageTrimmed.length < 15 && !hasTopicKeywords) {
    return true;
  }
  
  // Check for messages that are ONLY casual/greeting phrases (no other content)
  // These are off-topic because they don't contribute to the conversation
  const casualOnlyPatterns = [
    /^(?:hi|hello|hey|thanks|thank you|ok|okay|yes|no|sure|alright|got it)$/i,
    /^(?:hi|hello|hey)\s+(?:there|everyone|all)$/i,
    /^(?:thanks|thank you)\s+(?:a lot|very much|so much)$/i,
    /^(?:ok|okay|sure|alright|got it|understood)$/i,
  ];
  
  // Only return true if the message is EXACTLY a casual phrase (no other content)
  if (casualOnlyPatterns.some(pattern => pattern.test(messageTrimmed))) {
    return true;
  }
  
  // If message is very short and doesn't contain any topic keywords, likely off-topic
  // But be more lenient for longer messages
  if (!hasTopicKeywords) {
    // For very short messages, be strict
    if (messageTrimmed.length < 20) {
      return true;
    }
    // For medium length messages, check if it's clearly unrelated
    // (e.g., talking about completely different topics)
    if (messageTrimmed.length < 50) {
      // Check for common off-topic indicators
      const offTopicIndicators = [
        /^(?:what|how|why|when|where|who).*(?:weather|time|date|today|tomorrow|yesterday)/i,
        /^(?:tell me|show me).*(?:joke|story|fun fact)/i,
      ];
      if (offTopicIndicators.some(pattern => pattern.test(messageTrimmed))) {
        return true;
      }
    }
  }
  
  // Default: assume message is on-topic (conservative approach)
  return false;
}

/**
 * Determine if RAG search should be triggered using keyword matching (fallback method)
 */
function shouldTriggerRAGWithKeywords(
  userMessage: string,
  topic: string,
  strategy: 'suggestion' | 'clarification',
  clarificationState?: {
    isAwaitingClarification: boolean;
    isReadyForSearch: boolean;
  },
  needsFactualSupport: boolean = false
): boolean {
  // Don't trigger if user is expressing clear opinion that doesn't need evidence
  if (isExpressingClearOpinion(userMessage)) {
    return false;
  }
  
  // Always trigger if user asks for evidence
  if (isAskingForEvidence(userMessage)) {
    return true;
  }
  
  // Always trigger if user expresses uncertainty
  if (isExpressingUncertainty(userMessage)) {
    return true;
  }
  
  // For clarification strategy: only trigger if ready for search
  if (strategy === 'clarification') {
    if (clarificationState) {
      // If awaiting clarification, don't search yet
      if (clarificationState.isAwaitingClarification && !clarificationState.isReadyForSearch) {
        return false;
      }
      // If ready for search, proceed
      if (clarificationState.isReadyForSearch) {
        return true;
      }
    }
    // If no clarification state, default to not searching (should ask clarification first)
    return false;
  }
  
  // For suggestion strategy: trigger if system needs factual support
  // Also trigger for substantive questions or substantial messages (to provide suggestions early)
  if (strategy === 'suggestion') {
    if (needsFactualSupport) {
      return true;
    }
    // For suggestion strategy, be more aggressive: trigger for substantial messages
    // Check if message is substantial (not just very short casual responses)
    const messageLength = userMessage.trim().length;
    if (messageLength >= 5) {
      // For suggestion strategy, trigger search for any substantial message
      // This ensures we provide suggestions early with evidence
      return true;
    }
  }
  
  // Default: don't trigger (conservative approach)
  return false;
}

/**
 * Determine if RAG search should be triggered
 * Uses LLM for semantic understanding when llmId is provided, otherwise falls back to keyword matching
 * 
 * @param userMessage - Current user message
 * @param topic - Conversation topic
 * @param strategy - Current conversation strategy
 * @param clarificationState - Current clarification state (if strategy is clarification)
 * @param needsFactualSupport - Whether system needs factual support for its standpoint
 * @param llmId - Optional LLM ID to use for semantic judgment
 * @returns Promise<boolean> - true if RAG should be triggered
 */
export async function shouldTriggerRAG(
  userMessage: string,
  topic: string,
  strategy: 'suggestion' | 'clarification',
  clarificationState?: {
    isAwaitingClarification: boolean;
    isReadyForSearch: boolean;
  },
  needsFactualSupport: boolean = false,
  llmId?: DLLMId
): Promise<boolean> {
  // If LLM ID is provided, use LLM for judgment
  if (llmId) {
    return await shouldTriggerRAGWithLLM(
      userMessage,
      topic,
      strategy,
      clarificationState,
      needsFactualSupport,
      llmId
    );
  }

  // Otherwise, use keyword matching (fallback)
  return shouldTriggerRAGWithKeywords(
    userMessage,
    topic,
    strategy,
    clarificationState,
    needsFactualSupport
  );
}

/**
 * Check if user message implies need for factual support
 * This detects when user's message suggests they need evidence/data to be convinced
 * 
 * @param userMessage - Current user message to analyze
 * @param hasRetrievedContext - Whether system already has retrieved context
 * @returns true if user message implies need for factual support
 */
export function needsFactualSupport(
  userMessage: string,
  hasRetrievedContext: boolean
): boolean {
  // If system doesn't have recent context and user is asking substantive questions, need search
  if (!hasRetrievedContext) {
    // Check if user is asking substantive questions (not just casual chat)
    const substantiveQuestionPatterns = [
      /(?:what|how|why|which|when|where|who).*(?:about|regarding|concerning|related to)/i,
      /(?:can you|could you|please).*(?:explain|tell me|show me|help me understand)/i,
      /(?:i want|i need|i'd like).*(?:to know|to understand|to learn)/i,
    ];
    
    if (substantiveQuestionPatterns.some(pattern => pattern.test(userMessage))) {
      return true;
    }
  }
  
  // Check if user message implies skepticism or need for proof
  const skepticismPatterns = [
    // User questions the claim
    /(?:really|actually|is that|are you sure|how do you know|what makes you think)/i,
    /(?:i doubt|i'm skeptical|i'm not convinced|i don't believe)/i,
    
    // User asks for proof/evidence
    /(?:prove|show me|demonstrate|back up|support).*(?:that|your|this|it)/i,
    /(?:where|what|which).*(?:proof|evidence|data|source|study|research)/i,
    
    // User expresses need for more information
    /(?:need|want|require).*(?:more|additional|further).*(?:information|data|evidence|proof)/i,
    /(?:i need|i want|i require).*(?:to see|to know|evidence|data|proof)/i,
    
    // User challenges the statement
    /(?:but|however|although).*(?:is|are|do|does|can|could)/i,
    /(?:what about|how about|what if).*(?:the|this|that|it)/i,
    
    // User asks for sources/references
    /(?:source|reference|citation|where did you get|where is this from)/i,
  ];
  
  if (skepticismPatterns.some(pattern => pattern.test(userMessage))) {
    return true;
  }
  
  // Check if user message contains words that suggest they're evaluating claims
  const evaluationPatterns = [
    /(?:according to|based on|studies show|research indicates|data suggests)/i,
    /(?:statistics|statistical|percentage|percent|study|studies|research)/i,
  ];
  
  // If user mentions these terms, they might be expecting factual support
  if (evaluationPatterns.some(pattern => pattern.test(userMessage))) {
    // But only if they're asking about it, not just mentioning it casually
    const askingPatterns = [
      /(?:what|which|how many|how much|what percentage|what data)/i,
      /(?:show|tell|give|provide).*(?:me|us)/i,
    ];
    
    if (askingPatterns.some(pattern => pattern.test(userMessage))) {
      return true;
    }
  }
  
  return false;
}

