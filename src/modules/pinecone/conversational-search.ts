/**
 * Conversational Search Implementation
 * Manages conversational search state and prompt generation
 */

import {
  ConversationalSearchState,
  ConversationStrategy,
  Standpoint,
  PineconeSnippet,
} from './pinecone.types';
import {
  retrieveContext,
  filterSnippetsByStandpoint,
  formatSnippetsForPrompt,
} from './pinecone.client';
import { 
  CONVERSATIONAL_SEARCH_DEFAULTS,
  STANDPOINT_CONFIG,
  STRATEGY_CONFIG,
  SYSTEM_PROMPT_TEMPLATE 
} from '~/conversational-search.config';

/**
 * Initialize conversational search state
 */
export function initializeSearchState(
  topic: string,
  standpoint: Standpoint,
  strategy: ConversationStrategy
): ConversationalSearchState {
  return {
    topic,
    standpoint,
    strategy,
    dialogueHistory: [],
    lastRetrievedContext: undefined,
  };
}

/**
 * Enhance query with topic context for better retrieval
 * Pinecone can handle the query directly, so we just add topic context
 */
export function enhanceQueryWithContext(
  query: string,
  topic: string,
  dialogueHistory: string[]
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
    state.topic,
    state.dialogueHistory
  );

  // Retrieve context from Pinecone
  const snippets = await retrieveContext({
    query: enhancedQuery,
    top_k: topK,
    snippet_size: snippetSize,
    standpoint: state.standpoint,
    conversationHistory: state.dialogueHistory,
  });

  // Filter by standpoint (if needed)
  const filteredSnippets = filterSnippetsByStandpoint(snippets, state.standpoint);

  return filteredSnippets;
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
  const contextString = formatSnippetsForPrompt(retrievedContext);

  const header = SYSTEM_PROMPT_TEMPLATE.header(state.topic);
  const roleDescription = SYSTEM_PROMPT_TEMPLATE.roleDescription(
    state.standpoint, 
    state.topic, 
    strategyInstructions
  );
  const contextIntro = SYSTEM_PROMPT_TEMPLATE.contextIntro;
  const instructions = SYSTEM_PROMPT_TEMPLATE.instructions(state.strategy);

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
 * Update conversational search state after a turn
 */
export function updateSearchState(
  state: ConversationalSearchState,
  userQuery: string,
  assistantResponse: string,
  retrievedContext?: PineconeSnippet[]
): ConversationalSearchState {
  return {
    ...state,
    dialogueHistory: [
      ...state.dialogueHistory,
      `User: ${userQuery}`,
      `Assistant: ${assistantResponse}`,
    ],
    lastRetrievedContext: retrievedContext || state.lastRetrievedContext,
  };
}

