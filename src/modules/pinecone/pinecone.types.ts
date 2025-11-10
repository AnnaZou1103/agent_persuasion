/**
 * Types for Pinecone Assistant Context Retrieval
 */

// Conversational strategy types
export type ConversationStrategy = 'suggestion' | 'clarification';

// Standpoint types
export type Standpoint = 'supporting' | 'opposing';

// Pinecone snippet types
export interface PineconeSnippet {
  type: string;
  content: string;
  score: number;
  reference?: {
    type: string;
    file?: {
      status: string;
      id: string;
      name: string;
      size: number;
      metadata: any;
      updated_on: string;
      created_on: string;
      percent_done: number;
      signed_url: string;
      error_message: string | null;
    };
    pages?: number[];
  };
}

// Context response from Pinecone
export interface PineconeContextResponse {
  snippets: PineconeSnippet[];
}

// Context retrieval options
export interface ContextRetrievalOptions {
  query: string;
  top_k?: number;
  snippet_size?: number;
  standpoint?: Standpoint;
  conversationHistory?: string[];
}

// Conversational search state
export interface ConversationalSearchState {
  topic: string;
  standpoint: Standpoint;
  strategy: ConversationStrategy;
  dialogueHistory: string[];
  lastRetrievedContext?: PineconeSnippet[];
}

