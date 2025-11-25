import * as React from 'react';

import { Box, Card, CardContent, Divider, Modal, ModalDialog, ModalOverflow, Typography } from '@mui/joy';

import { CONVERSATION_TOPICS, ConversationTopic } from '../topics';

/**
 * Modal for selecting a conversation topic before starting a conversation
 * User must select a topic - modal cannot be closed by clicking outside or pressing Escape
 */
export function TopicSelectionModal(props: {
  open: boolean;
  onSelectTopic: (topic: ConversationTopic) => void;
}) {
  const handleTopicSelect = (topic: ConversationTopic) => {
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
            {CONVERSATION_TOPICS.map((topic, index) => (
              <Card
                key={index}
                variant="outlined"
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: 'md',
                    borderColor: 'primary.500',
                  },
                }}
                onClick={() => handleTopicSelect(topic)}
              >
                <CardContent>
                  <Typography level="title-sm" sx={{ mb: 0.5 }}>
                    Topic {index + 1}
                  </Typography>
                  <Typography level="body-md">
                    {topic}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </ModalDialog>
      </ModalOverflow>
    </Modal>
  );
}

