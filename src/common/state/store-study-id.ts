import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Standpoint, ConversationStrategy } from '~/modules/pinecone/pinecone.types';
import { CONVERSATION_TOPICS, ConversationTopic } from '~/apps/chat/topics';

/**
 * Topic configuration mapping
 */
export interface TopicConfig {
  standpoint: Standpoint;
  strategy: ConversationStrategy;
}

/**
 * Store for managing study ID and topic configurations
 * Study ID is persisted in localStorage and shared across all conversations
 */
interface StudyIdStore {
  studyId: string | null;
  topicConfig: Record<ConversationTopic, TopicConfig> | null;
  setStudyId: (studyId: string) => void;
  clearStudyId: () => void;
  generateTopicConfig: () => void;
  getTopicConfig: (topic: ConversationTopic) => TopicConfig | null;
}

/**
 * Generate random topic configurations ensuring opposite standpoint and strategy for two topics
 */
function generateTopicConfigs(): Record<ConversationTopic, TopicConfig> {
  const topics = CONVERSATION_TOPICS;
  
  // Randomly choose standpoint and strategy for first topic
  const firstStandpoint: Standpoint = Math.random() < 0.5 ? 'supporting' : 'opposing';
  const firstStrategy: ConversationStrategy = Math.random() < 0.5 ? 'suggestion' : 'clarification';
  
  // Second topic gets opposite standpoint and strategy
  const secondStandpoint: Standpoint = firstStandpoint === 'supporting' ? 'opposing' : 'supporting';
  const secondStrategy: ConversationStrategy = firstStrategy === 'suggestion' ? 'clarification' : 'suggestion';
  
  // Randomly assign which topic gets which config
  const useFirstConfigForFirstTopic = Math.random() < 0.5;
  
  return {
    [topics[0]]: useFirstConfigForFirstTopic
      ? { standpoint: firstStandpoint, strategy: firstStrategy }
      : { standpoint: secondStandpoint, strategy: secondStrategy },
    [topics[1]]: useFirstConfigForFirstTopic
      ? { standpoint: secondStandpoint, strategy: secondStrategy }
      : { standpoint: firstStandpoint, strategy: firstStrategy },
  } as Record<ConversationTopic, TopicConfig>;
}

export const useStudyIdStore = create<StudyIdStore>()(
  persist(
    (set, get) => ({
      studyId: null,
      topicConfig: null,
      setStudyId: (studyId: string) => {
        set({ studyId });
        // Generate topic config when study ID is set
        get().generateTopicConfig();
      },
      clearStudyId: () => set({ studyId: null, topicConfig: null }),
      generateTopicConfig: () => {
        const config = generateTopicConfigs();
        set({ topicConfig: config });
        console.log('[StudyIdStore] Generated topic config:', config);
      },
      getTopicConfig: (topic: ConversationTopic) => {
        const { topicConfig } = get();
        return topicConfig?.[topic] || null;
      },
    }),
    {
      name: 'app-study-id',
    },
  ),
);

