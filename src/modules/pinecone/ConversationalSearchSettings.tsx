/**
 * UI Component for Conversational Search Settings
 */

import * as React from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Radio,
  RadioGroup,
  Sheet,
  Stack,
  Switch,
  Typography,
  Divider,
  Alert,
} from '@mui/joy';
import { useConversationalSearchStore } from './store-conversational-search';
import { ConversationStrategy, Standpoint } from './pinecone.types';
import { isPineconeEnabled } from './pinecone.config';
import { 
  CONVERSATIONAL_SEARCH_DEFAULTS,
  STANDPOINT_CONFIG,
  STRATEGY_CONFIG 
} from '~/conversational-search.config';

export function ConversationalSearchSettings() {
  const {
    isEnabled,
    searchState,
    topK,
    snippetSize,
    setEnabled,
    initializeSearch,
    resetSearch,
    setConfiguration,
  } = useConversationalSearchStore();

  const [topic, setTopic] = React.useState(searchState?.topic || CONVERSATIONAL_SEARCH_DEFAULTS.defaultTopic);
  const [standpoint, setStandpoint] = React.useState<Standpoint>(
    searchState?.standpoint || CONVERSATIONAL_SEARCH_DEFAULTS.defaultStandpoint
  );
  const [strategy, setStrategy] = React.useState<ConversationStrategy>(
    searchState?.strategy || CONVERSATIONAL_SEARCH_DEFAULTS.defaultStrategy
  );
  const [localTopK, setLocalTopK] = React.useState(topK);
  const [localSnippetSize, setLocalSnippetSize] = React.useState(snippetSize);

  const pineconeConfigured = isPineconeEnabled();
  const searchInitialized = !!searchState;

  const handleInitialize = () => {
    if (!topic.trim()) {
      alert(CONVERSATIONAL_SEARCH_DEFAULTS.topicEmptyAlert);
      return;
    }
    initializeSearch(topic.trim(), standpoint, strategy);
    setConfiguration(localTopK, localSnippetSize);
  };

  const handleReset = () => {
    resetSearch();
    setTopic('');
  };

  return (
    <Sheet variant="outlined" sx={{ p: 3, borderRadius: 'sm' }}>
      <Stack spacing={3}>
        <Box>
          <Typography level="h4" sx={{ mb: 1 }}>
            Conversational Search
          </Typography>
          <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
            Enable RAG-powered conversational search with Pinecone Assistant
          </Typography>
        </Box>

        {!pineconeConfigured && (
          <Alert color="warning">
            Pinecone is not configured. Please set PINECONE_API_KEY and
            PINECONE_ASSISTANT_NAME in your environment variables.
          </Alert>
        )}

        <FormControl>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Switch
              checked={isEnabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={!pineconeConfigured}
            />
            <FormLabel>Enable Conversational Search</FormLabel>
          </Box>
        </FormControl>

        {isEnabled && pineconeConfigured && (
          <>
            <Divider />

            <FormControl>
              <FormLabel>Conversation Topic</FormLabel>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={CONVERSATIONAL_SEARCH_DEFAULTS.topicPlaceholder}
                disabled={searchInitialized}
              />
            </FormControl>

            <FormControl disabled={searchInitialized}>
              <FormLabel>Standpoint</FormLabel>
              <RadioGroup
                value={standpoint}
                onChange={(e) => setStandpoint(e.target.value as Standpoint)}
              >
                <Radio value="supporting" label={STANDPOINT_CONFIG.supporting.label} disabled={searchInitialized} />
                <Radio value="opposing" label={STANDPOINT_CONFIG.opposing.label} disabled={searchInitialized} />
              </RadioGroup>
            </FormControl>

            <FormControl>
              <FormLabel>Conversation Strategy</FormLabel>
              <RadioGroup
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as ConversationStrategy)}
              >
                <Radio
                  value="suggestion"
                  label="Suggestion - Offer advice and direction"
                  disabled={searchInitialized}
                />
                <Radio
                  value="clarification"
                  label="Clarification - Resolve query ambiguity"
                  disabled={searchInitialized}
                />
              </RadioGroup>
            </FormControl>

            <Divider />

            <Typography level="title-sm">Retrieval Configuration</Typography>

            <FormControl>
              <FormLabel>Top K (Number of context snippets)</FormLabel>
              <Input
                type="number"
                value={localTopK}
                onChange={(e) => setLocalTopK(Number(e.target.value))}
                slotProps={{
                  input: { 
                    min: CONVERSATIONAL_SEARCH_DEFAULTS.topKMin, 
                    max: CONVERSATIONAL_SEARCH_DEFAULTS.topKMax 
                  },
                }}
                disabled={searchInitialized}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Snippet Size (Max tokens per snippet)</FormLabel>
              <Input
                type="number"
                value={localSnippetSize}
                onChange={(e) => setLocalSnippetSize(Number(e.target.value))}
                slotProps={{
                  input: { 
                    min: CONVERSATIONAL_SEARCH_DEFAULTS.snippetSizeMin, 
                    max: CONVERSATIONAL_SEARCH_DEFAULTS.snippetSizeMax 
                  },
                }}
                disabled={searchInitialized}
              />
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2 }}>
              {!searchInitialized ? (
                <Button
                  fullWidth
                  variant="solid"
                  color="primary"
                  onClick={handleInitialize}
                >
                  Initialize Search
                </Button>
              ) : (
                <>
                  <Button fullWidth variant="soft" color="neutral" disabled>
                    Search Active: {topic}
                  </Button>
                  <Button variant="outlined" color="danger" onClick={handleReset}>
                    Reset
                  </Button>
                </>
              )}
            </Box>

            {searchInitialized && (
              <Alert color="success">
                Conversational search is active. Your messages will be enhanced
                with relevant context from Pinecone.
              </Alert>
            )}
          </>
        )}
      </Stack>
    </Sheet>
  );
}

