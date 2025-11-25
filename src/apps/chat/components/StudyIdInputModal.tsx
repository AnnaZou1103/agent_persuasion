import * as React from 'react';

import { Box, Button, Divider, Input, Modal, ModalDialog, ModalOverflow, Typography } from '@mui/joy';

import { useStudyIdStore } from '~/common/state/store-study-id';

/**
 * Modal for entering study ID before starting a conversation
 * User must enter a study ID - modal cannot be closed by clicking outside or pressing Escape
 */
export function StudyIdInputModal(props: {
  open: boolean;
  onStudyIdSet: () => void;
}) {
  const [studyIdInput, setStudyIdInput] = React.useState('');
  const [error, setError] = React.useState('');
  const { setStudyId } = useStudyIdStore();

  const handleSubmit = async () => {
    const trimmedId = studyIdInput.trim();
    if (!trimmedId) {
      setError('Please enter a study ID');
      return;
    }
    try {
      setStudyId(trimmedId);
      setStudyIdInput('');
      setError('');
      // Use setTimeout to ensure state update is processed before calling callback
      setTimeout(() => {
        props.onStudyIdSet();
      }, 0);
    } catch (error) {
      console.error('Error setting study ID:', error);
      setError('Failed to save study ID. Please try again.');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  };

  // Prevent closing by clicking outside or pressing Escape
  const handleClose = (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
    // Do nothing - user must enter a study ID
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
            minWidth: { xs: 360, sm: 500, md: 600 },
            maxWidth: 600,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <Box sx={{ mb: -1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography level="title-md">
              Enter Study ID
            </Typography>
            {/* No close button - user must enter a study ID */}
          </Box>

          <Divider />

          <Typography level="body-md" sx={{ mb: 2 }}>
          Please enter your study ID to continue. This ID will be associated with all your conversations.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Input
              placeholder="Enter your study ID"
              value={studyIdInput}
              onChange={(e) => {
                setStudyIdInput(e.target.value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              error={!!error}
              autoFocus
              sx={{ width: '100%' }}
            />
            {error && (
              <Typography level="body-sm" color="danger">
                {error}
              </Typography>
            )}
            <Button
              onClick={handleSubmit}
              variant="solid"
              color="primary"
              sx={{ width: '100%' }}
            >
              Continue
            </Button>
          </Box>
        </ModalDialog>
      </ModalOverflow>
    </Modal>
  );
}

