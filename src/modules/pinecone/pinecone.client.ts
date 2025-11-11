/**
 * Pinecone Client for Context Retrieval
 * Handles communication with Pinecone Assistant API
 */

import { PINECONE_CONFIG, isPineconeEnabled } from './pinecone.config';
import {
  PineconeContextResponse,
  ContextRetrievalOptions,
  PineconeSnippet,
} from './pinecone.types';

/**
 * Retrieve context snippets from Pinecone Assistant
 */
export async function retrieveContext(
  options: ContextRetrievalOptions
): Promise<PineconeSnippet[]> {
  if (!isPineconeEnabled()) {
    console.warn('Pinecone is not enabled. Returning empty context.');
    return [];
  }

  const {
    query,
    top_k = PINECONE_CONFIG.defaultTopK,
    snippet_size = PINECONE_CONFIG.defaultSnippetSize,
  } = options;

  try {
    const response = await fetch(
      `https://prod-1-data.ke.pinecone.io/assistant/chat/${PINECONE_CONFIG.assistantName}/context`,
      {
        method: 'POST',
        headers: {
          'Api-Key': PINECONE_CONFIG.apiKey,
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Pinecone-API-Version': '2025-04',
        },
        body: JSON.stringify({
          query,
          top_k,
          snippet_size,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Pinecone API error: ${response.status} ${response.statusText}`);
    }

    const data: PineconeContextResponse = await response.json();
    return data.snippets || [];
  } catch (error) {
    console.error('Error retrieving context from Pinecone:', error);
    throw error;
  }
}

/**
 * Filter snippets based on similarity score threshold
 * 
 * @param snippets - Array of snippets to filter
 * @param minScore - Minimum similarity score (0.0-1.0)
 * @returns Filtered snippets with score >= minScore
 */
export function filterSnippetsByScore(
  snippets: PineconeSnippet[],
  minScore: number = 0.7
): PineconeSnippet[] {
  const filtered = snippets.filter(snippet => snippet.score >= minScore);
  
  if (filtered.length < snippets.length) {
    console.log(`[Score Filter] Filtered out ${snippets.length - filtered.length} low-score snippets (min: ${minScore})`);
    console.log(`[Score Filter] Remaining: ${filtered.length} snippets`);
  }
  
  return filtered;
}

/**
 * Filter snippets based on standpoint
 * 
 * WORKAROUND: Since Pinecone REST API doesn't support metadata,
 * we encode stance in filename as [stance]original-name.ext
 * 
 * This function tries both methods:
 * 1. Check metadata.stance (for future compatibility)
 * 2. Parse stance from filename pattern [supporting] or [opposing]
 */
export function filterSnippetsByStandpoint(
  snippets: PineconeSnippet[],
  standpoint: 'supporting' | 'opposing'
): PineconeSnippet[] {
  return snippets.filter(snippet => {
    // Method 1: Check metadata (for future compatibility)
    const metadata = snippet.reference?.file?.metadata;
    if (metadata?.stance) {
      return metadata.stance === standpoint;
    }
    
    // Method 2: Parse stance from filename
    const fileName = snippet.reference?.file?.name;
    if (fileName) {
      const stanceMatch = fileName.match(/^\[(supporting|opposing)\]/);
      if (stanceMatch) {
        return stanceMatch[1] === standpoint;
      }
    }
    
    // If no stance info found in metadata or filename, filter out
    return false;
  });
}

/**
 * Format snippets into a context string for the prompt
 */
export function formatSnippetsForPrompt(snippets: PineconeSnippet[]): string {
  if (snippets.length === 0) {
    return 'No relevant context found.';
  }

  return snippets
    .map((snippet, index) => {
      const sourceInfo = snippet.reference?.file?.name
        ? `[Source: ${snippet.reference.file.name}${snippet.reference.pages ? `, Pages: ${snippet.reference.pages.join(', ')}` : ''}]`
        : '[Source: Unknown]';
      
      return `Context ${index + 1} (Score: ${snippet.score.toFixed(4)}):
${sourceInfo}
${snippet.content.trim()}
`;
    })
    .join('\n---\n\n');
}

