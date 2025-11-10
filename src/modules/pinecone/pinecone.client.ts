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
 * Filter snippets based on standpoint using document metadata
 * Expected metadata format: { stance: 'supporting' | 'opposing' }
 * Documents without stance metadata are kept (treated as neutral)
 */
export function filterSnippetsByStandpoint(
  snippets: PineconeSnippet[],
  standpoint: 'supporting' | 'opposing'
): PineconeSnippet[] {
  return snippets.filter(snippet => {
    const metadata = snippet.reference?.file?.metadata;
    
    // If no metadata or no stance field, keep the snippet (neutral document)
    if (!metadata || !metadata.stance) {
      return true;
    }
    
    // If document has stance metadata, only keep matching documents
    return metadata.stance === standpoint;
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

