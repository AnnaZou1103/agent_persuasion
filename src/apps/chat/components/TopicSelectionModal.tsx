import * as React from 'react';

import { Box, Card, CardContent, Divider, Modal, ModalDialog, ModalOverflow, Typography, Alert } from '@mui/joy';

import { CONVERSATION_TOPICS, ConversationTopic } from '../topics';

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: readonly T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Modal for selecting a conversation topic before starting a conversation
 * User must select a topic - modal cannot be closed by clicking outside or pressing Escape
 */
export function TopicSelectionModal(props: {
  open: boolean;
  onSelectTopic: (topic: ConversationTopic) => void;
  discussedTopics?: ConversationTopic[]; // Topics that have already been discussed
}) {
  // Randomize topic order each time the modal opens
  const shuffledTopics = React.useMemo(() => {
    if (props.open) {
      return shuffleArray(CONVERSATION_TOPICS);
    }
    return CONVERSATION_TOPICS;
  }, [props.open]);

  // Check which topics have been discussed
  const discussedTopics = props.discussedTopics || [];
  const isTopicDiscussed = (topic: ConversationTopic) => discussedTopics.includes(topic);

  const handleTopicSelect = (topic: ConversationTopic) => {
    // Don't allow selecting already discussed topics
    if (isTopicDiscussed(topic)) {
      return;
    }
    props.onSelectTopic(topic);
  };

  // Prevent closing by clicking outside or pressing Escape
  const handleClose = (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
    // Do nothing - user must select a topic
    event;
    reason;
  };

  return (
    <Modal 
      open={props.open} 
      onClose={handleClose}
      disableEscapeKeyDown
    >
      <ModalOverflow>
        <ModalDialog
          sx={{
            minWidth: { xs: 360, sm: 500, md: 600, lg: 700 },
            maxWidth: 700,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <Box sx={{ mb: -1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography level="title-md">
              Select a Topic
            </Typography>
            {/* No close button - user must select a topic */}
          </Box>

          <Divider />

          <Typography level="body-md" sx={{ mb: 2 }}>
            Please select a topic to start the conversation:
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {shuffledTopics.map((topic, index) => {
              const isDiscussed = isTopicDiscussed(topic);
              return (
                <Card
                  key={topic}
                  variant={isDiscussed ? "soft" : "outlined"}
                  sx={{
                    cursor: isDiscussed ? 'not-allowed' : 'pointer',
                    opacity: isDiscussed ? 0.6 : 1,
                    transition: 'all 0.2s',
                    ...(isDiscussed ? {} : {
                      '&:hover': {
                        boxShadow: 'md',
                        borderColor: 'primary.500',
                      },
                    }),
                  }}
                  onClick={() => handleTopicSelect(topic)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography level="title-sm">
                        Topic {index + 1}
                      </Typography>
                      {isDiscussed && (
                        <Typography level="body-sm" color="neutral" sx={{ fontStyle: 'italic' }}>
                          Already discussed
                        </Typography>
                      )}
                    </Box>
                    <Typography level="body-md">
                      {topic}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Box>

          <Alert variant="soft" color="primary" sx={{ mt: 1 }}>
            <Typography level="body-sm">
              <strong>Important:</strong> Please select one topic per round. If you have already discussed a topic, please select the other one instead.
            </Typography>
          </Alert>
        </ModalDialog>
      </ModalOverflow>
    </Modal>
  );
}

