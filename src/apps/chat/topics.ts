/**
 * Predefined conversation topics
 */

export const CONVERSATION_TOPICS = [
  "Should cell phones be allowed in school?",
  "Should disposable syringes be provided free of charge to homeless individuals in the Mass and Cass area?",
] as const;

export type ConversationTopic = typeof CONVERSATION_TOPICS[number];

