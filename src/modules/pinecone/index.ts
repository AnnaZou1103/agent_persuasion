/**
 * Pinecone Module - Unified Exports
 * 
 * This file provides a centralized export point for all Pinecone functionality
 */

// ============================================
// Core Types
// ============================================
export type {
  ConversationStrategy,
  Standpoint,
  PineconeSnippet,
  PineconeContextResponse,
  ContextRetrievalOptions,
  ConversationalSearchState,
} from './pinecone.types';

// ============================================
// Configuration
// ============================================
export {
  PINECONE_CONFIG,
  validatePineconeConfig,
  isPineconeEnabled,
} from './pinecone.config';

// ============================================
// Context Retrieval (Client Functions)
// ============================================
export {
  retrieveContext,
  filterSnippetsByStandpoint,
  formatSnippetsForPrompt,
} from './pinecone.client';

// ============================================
// File Upload Functions
// ============================================
export type {
  FileMetadata,
  UploadResponse,
  UploadOptions,
  BatchUploadResult,
} from './pinecone.upload';

export {
  uploadFile,
  uploadFileBatch,
  uploadFileBatchParallel,
  getFileStatus,
  deleteFile,
  listFiles,
} from './pinecone.upload';

// ============================================
// React Components
// ============================================
export {
  FileUploadComponent,
  SimpleFileUploadButton,
} from './FileUploadComponent';

// ============================================
// Conversational Search
// ============================================
export {
  initializeSearchState,
  generateSystemPrompt,
  retrieveContextForQuery,
  updateSearchState,
} from './conversational-search';

// Note: Store and settings components are exported separately if needed
// export { useConversationalSearch } from './store-conversational-search';
// export { ConversationalSearchSettings } from './ConversationalSearchSettings';

