/**
 * Predefined conversation topics
 */

export const CONVERSATION_TOPICS = [
  "How should Boston respond to the Mass & Cass crisis?",
  "Should Cell Phones Be Banned in Schools?",
] as const;

export type ConversationTopic = typeof CONVERSATION_TOPICS[number];

