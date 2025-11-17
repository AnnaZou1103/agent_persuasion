/**
 * Conversational Search Implementation
 * Manages conversational search state and prompt generation
 */

import {
  ConversationalSearchState,
  ConversationStrategy,
  Standpoint,
  PineconeSnippet,
  ConversationStats,
  ClarificationState,
} from './pinecone.types';
import {
  retrieveContext,
  filterSnippetsByStandpoint,
  filterSnippetsByScore,
  formatSnippetsForPrompt,
} from './pinecone.client';
import { 
  CONVERSATIONAL_SEARCH_DEFAULTS,
  STANDPOINT_CONFIG,
  STRATEGY_CONFIG,
  SYSTEM_PROMPT_TEMPLATE 
} from '~/conversational-search.config';
import { shouldTriggerRAG, needsFactualSupport } from './rag-trigger';
import { DLLMId } from '~/modules/llms/store-llms';

/**
 * Initialize conversational search state
 */
export function initializeSearchState(
  topic: string,
  standpoint: Standpoint,
  strategy: ConversationStrategy
): ConversationalSearchState {
  const stats: ConversationStats = {
    searchTriggerCount: 0,
    clarificationQuestionCount: 0,
    suggestionCount: 0,
    conversationTurns: 0,
  };

  const clarificationState: ClarificationState | undefined = 
    strategy === 'clarification'
      ? {
          isAwaitingClarification: false,
          pendingClarificationQuestions: [],
          isReadyForSearch: false,
        }
      : undefined;

  return {
    topic,
    standpoint,
    strategy,
    dialogueHistory: [],
    lastRetrievedContext: undefined,
    stats,
    clarificationState,
  };
}

/**
 * Enhance query with topic context for better retrieval
 * Pinecone can handle the query directly, so we just add topic context
 */
export function enhanceQueryWithContext(
  query: string,
  topic: string
): string {
  // Simply combine topic with the query for better context
  // Pinecone Assistant handles the semantic understanding
  return `${topic}: ${query}`;
}

/**
 * Retrieve and filter context based on search state
 */
export async function retrieveContextForQuery(
  query: string,
  state: ConversationalSearchState,
  topK?: number,
  snippetSize?: number
): Promise<PineconeSnippet[]> {
  // Enhance query with topic context
  // Pinecone Assistant handles semantic understanding directly
  const enhancedQuery = enhanceQueryWithContext(
    query,
    state.topic
  );

  // Retrieve context from Pinecone
  const snippets = await retrieveContext({
    query: enhancedQuery,
    top_k: topK,
    snippet_size: snippetSize,
    standpoint: state.standpoint,
  });

  console.log(`[Search] Retrieved ${snippets.length} snippets from Pinecone`);

  // Filter by similarity score first (if enabled)
  let filteredSnippets = snippets;
  if (CONVERSATIONAL_SEARCH_DEFAULTS.enableScoreFiltering) {
    filteredSnippets = filterSnippetsByScore(snippets, CONVERSATIONAL_SEARCH_DEFAULTS.minSimilarityScore);
    
    // Warn if best score is low
    if (snippets.length > 0 && snippets[0].score < CONVERSATIONAL_SEARCH_DEFAULTS.warnThreshold) {
      console.warn(`[Search] Best similarity score is low: ${snippets[0].score.toFixed(4)} (threshold: ${CONVERSATIONAL_SEARCH_DEFAULTS.warnThreshold})`);
    }
  }

  // Then filter by standpoint
  const finalSnippets = filterSnippetsByStandpoint(filteredSnippets, state.standpoint);

  console.log(`[Search] Final result: ${finalSnippets.length} snippets after filtering`);

  return finalSnippets;
}

/**
 * Generate system prompt with retrieved context
 */
export function generateSystemPrompt(
  state: ConversationalSearchState,
  retrievedContext: PineconeSnippet[]
): string {
  const strategyInstructions = getStrategyInstructions(state.strategy);
  const standpointInstructions = getStandpointInstructions(state.standpoint);
  const hasRetrievedContext = retrievedContext.length > 0;
  const contextString = hasRetrievedContext 
    ? formatSnippetsForPrompt(retrievedContext)
    : 'No retrieved evidence available yet.';

  const header = SYSTEM_PROMPT_TEMPLATE.header(state.topic);
  const roleDescription = SYSTEM_PROMPT_TEMPLATE.roleDescription(
    state.standpoint, 
    state.topic, 
    strategyInstructions
  );
  const contextIntro = SYSTEM_PROMPT_TEMPLATE.contextIntro;
  const instructions = SYSTEM_PROMPT_TEMPLATE.instructions(state.strategy, hasRetrievedContext);

  return `${header}

${roleDescription}
${standpointInstructions}
${contextIntro}

${contextString}
${instructions}`;
}

/**
 * Get strategy-specific instructions
 */
function getStrategyInstructions(strategy: ConversationStrategy): string {
  return STRATEGY_CONFIG[strategy]?.instructions || 'Engage in natural conversation about the topic.';
}

/**
 * Get standpoint-specific instructions
 */
function getStandpointInstructions(standpoint: Standpoint): string {
  return STANDPOINT_CONFIG[standpoint]?.instructions || 'Maintain a balanced perspective on the topic.';
}

/**
 * Determine conversation action based on strategy and user input
 */
export async function determineConversationAction(
  userMessage: string,
  state: ConversationalSearchState,
  llmId?: DLLMId
): Promise<{
  shouldSearch: boolean;
  shouldAskClarification: boolean;
  shouldProvideSuggestion: boolean;
}> {
  const { strategy, clarificationState } = state;

  // For Clarification strategy
  if (strategy === 'clarification') {
    if (!clarificationState) {
      // Initialize clarification state if missing
      return {
        shouldSearch: false,
        shouldAskClarification: true,
        shouldProvideSuggestion: false,
      };
    }

    // If awaiting clarification and user hasn't expressed need for search
    if (clarificationState.isAwaitingClarification && !clarificationState.isReadyForSearch) {
      // Check if user is ready for search
      const readyForSearch = await shouldTriggerRAG(
        userMessage,
        state.topic,
        strategy,
        clarificationState,
        false,
        llmId
      );

      if (readyForSearch) {
        return {
          shouldSearch: true,
          shouldAskClarification: false,
          shouldProvideSuggestion: false,
        };
      } else {
        // Continue asking clarification
        return {
          shouldSearch: false,
          shouldAskClarification: true,
          shouldProvideSuggestion: false,
        };
      }
    }

    // If not awaiting clarification, check if question is clear
    const needsClarification = !isQuestionClear(userMessage);
    if (needsClarification) {
      return {
        shouldSearch: false,
        shouldAskClarification: true,
        shouldProvideSuggestion: false,
      };
    }

    // Question is clear, check if should search
    const shouldSearch = await shouldTriggerRAG(
      userMessage,
      state.topic,
      strategy,
      clarificationState,
      false,
      llmId
    );

    return {
      shouldSearch,
      shouldAskClarification: false,
      shouldProvideSuggestion: false, // Clarification strategy never provides suggestions
    };
  }

  // For Suggestion strategy
  if (strategy === 'suggestion') {
    // For suggestion strategy: search early when user asks questions
    // According to config: "When user asks a question, FIRST search for relevant evidence"
    // Check if this is a substantive question (not just casual chat)
    const isQuestion = isQuestionClear(userMessage);
    
    // If user hasn't received context yet, or asks questions, trigger search
    const hasContext = !!state.lastRetrievedContext && state.lastRetrievedContext.length > 0;
    const needsSupport = needsFactualSupport(userMessage, hasContext);
    
    // For suggestion strategy: be more aggressive in triggering search
    // Check if message is substantial (not just very short casual responses)
    const isSubstantial = userMessage.trim().length >= 5; // Lower threshold for suggestion strategy
    
    // For suggestion strategy: search if:
    // 1. First message (no context yet) and message is substantial → always search
    // 2. User asks questions (first time - no context yet) → always search
    // 3. User asks questions and system needs factual support → search
    // 4. User explicitly asks for evidence → search (handled by shouldTriggerRAG)
    // 5. System needs factual support → search (handled by shouldTriggerRAG)
    if (!hasContext) {
      // First message: search if substantial (not just "hi" or "ok")
      if (isSubstantial) {
        return {
          shouldSearch: true,
          shouldAskClarification: false,
          shouldProvideSuggestion: true,
        };
      }
    }
    
    // For follow-up questions or when context exists, use LLM/keyword judgment
    // Pass isSubstantial to make it more likely to trigger
    const shouldSearch = await shouldTriggerRAG(
      userMessage,
      state.topic,
      strategy,
      undefined,
      needsSupport || isQuestion || isSubstantial, // More likely to trigger for substantial messages
      llmId
    );

    return {
      shouldSearch,
      shouldAskClarification: false,
      shouldProvideSuggestion: true, // Always provide suggestions
    };
  }

  // Default
  return {
    shouldSearch: false,
    shouldAskClarification: false,
    shouldProvideSuggestion: false,
  };
}

/**
 * Check if user question is clear enough (simple heuristic)
 */
function isQuestionClear(userMessage: string): boolean {
  // Very short messages are likely unclear
  if (userMessage.trim().length < 10) {
    return false;
  }

  // Questions with "what", "how", "why" are usually clear
  const clearQuestionPatterns = [
    /(?:what|how|why|which|when|where|who|whom|whose)/i,
  ];

  return clearQuestionPatterns.some(pattern => pattern.test(userMessage));
}


/**
 * Update conversational search state after a turn
 */
export function updateSearchState(
  state: ConversationalSearchState,
  userQuery: string,
  assistantResponse: string,
  retrievedContext?: PineconeSnippet[],
  actionTaken?: {
    searched: boolean;
    askedClarification: boolean;
    providedSuggestion: boolean;
  }
): ConversationalSearchState {
  // Stats are already updated in chat-stream.ts before LLM response
  // So we just use the existing stats without modification to avoid double counting
  // This function only updates dialogueHistory, lastRetrievedContext, and clarificationState
  const newStats: ConversationStats = {
    ...state.stats,
  };

  // Update clarification state if applicable
  let newClarificationState = state.clarificationState;
  if (state.strategy === 'clarification' && newClarificationState) {
    if (actionTaken?.askedClarification) {
      newClarificationState = {
        ...newClarificationState,
        isAwaitingClarification: true,
      };
    } else if (actionTaken?.searched) {
      newClarificationState = {
        ...newClarificationState,
        isAwaitingClarification: false,
        isReadyForSearch: true,
      };
    }
  }

  return {
    ...state,
    dialogueHistory: [
      ...state.dialogueHistory,
      `User: ${userQuery}`,
      `Assistant: ${assistantResponse}`,
    ],
    lastRetrievedContext: retrievedContext !== undefined ? retrievedContext : state.lastRetrievedContext,
    stats: newStats,
    clarificationState: newClarificationState,
  };
}


