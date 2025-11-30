import * as React from 'react';
import { useRouter } from 'next/router';

import { Box, Button, Card, CardContent, Container, Divider, Input, Typography } from '@mui/joy';

import { Brand } from '~/common/brand';
import { Link } from '~/common/components/Link';
import { capitalizeFirstLetter } from '~/common/util/textUtils';
import { useStudyIdStore } from '~/common/state/store-study-id';

import { NewsItems } from './news.data';


export function AppNews() {
  const router = useRouter();
  const { studyId, setStudyId } = useStudyIdStore();
  
  // state
  const [lastNewsIdx, setLastNewsIdx] = React.useState<number>(0);
  const [studyIdInput, setStudyIdInput] = React.useState('');
  const [error, setError] = React.useState('');

  // news selection
  const news = NewsItems.filter((_, idx) => idx <= lastNewsIdx);
  const firstNews = news[0] ?? null;

  // Handle study ID submission
  const handleStudyIdSubmit = () => {
    const trimmedId = studyIdInput.trim();
    if (!trimmedId) {
      setError('Please enter a study ID');
      return;
    }
    try {
      setStudyId(trimmedId);
      setStudyIdInput('');
      setError('');
      // Navigate to chat page after setting study ID
      router.push('/');
    } catch (error) {
      console.error('Error setting study ID:', error);
      setError('Failed to save study ID. Please try again.');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleStudyIdSubmit();
    }
  };

  return (

    <Box sx={{
      backgroundColor: 'background.level1',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      flexGrow: 1,
      overflowY: 'auto',
      minHeight: 96,
      p: { xs: 3, md: 6 },
      gap: 4,
    }}>
  
      {/* Task Instructions - only show if study ID is set */}
      {studyId && (
        <>
          <Typography level='h1' sx={{fontSize: '2.3rem'}}>
              Task Instructions
          </Typography>
          <Container disableGutters maxWidth='sm'>
              <Card>
              <CardContent sx={{ position: 'relative', pr:0 }}>
              <Typography level='h2' fontSize="xl"sx={{ mb: 0.5 }}  component='div'>Conversational Search Task</Typography>
              <p style={{ marginTop: 8, marginBottom: 8 }}>
                  In this task, you will have conversations with a chatbot to explore information about <strong>two topics</strong>. 
                  The chatbot will provide helpful information to answer your questions. Have a natural conversation with the chatbot.
              </p>
              
              <Typography level='h3' fontSize="lg" sx={{ mt: 2, mb: 0.5 }} component='div'>Study Flow</Typography>
              <p style={{ marginTop: 4, marginBottom: 8 }}>
                  You will complete the following steps for <strong>each</strong> of the two topics:
              </p>
              <ol style={{ marginTop: 8, marginBottom: 8, paddingInlineStart: 24 }}>
                  <li>Chat with the chatbot about the selected topic</li>
                  <li>Write a memo about the topic with the chatbot by clicking the button below the chat button</li>
                  <li>Submit your conversation by clicking the button below the memo button</li>
                  <li>Fill out the post survey (will open in a new tab)</li>
              </ol>
              <p style={{ marginTop: 8, marginBottom: 8 }}>
                  After completing these steps for the first topic, repeat the same process for the second topic.
              </p>
              
              <Typography level='h3' fontSize="lg" sx={{ mt: 2, mb: 0.5 }} component='div'>Helpful Tips</Typography>
              <ul style={{ marginTop: 8, marginBottom: 8, paddingInlineStart: 24 }}>
                  <li>To start a new conversation for a different topic, click the button on the upper left corner.</li>
                  <li>To view these instructions again at any time, click the button on the upper right corner.</li>
              </ul>
              </CardContent>
              </Card>
            </Container>
        </>
      )}

      {/* Study ID Input Section - only show if no study ID */}
      {!studyId ? (
        <Container disableGutters maxWidth='sm'>
          <Card>
            <CardContent sx={{ position: 'relative', pr: 0 }}>
              <Typography level='h2' fontSize="xl" sx={{ mb: 0.5 }} component='div'>
                Enter Study ID
              </Typography>
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
                  onClick={handleStudyIdSubmit}
                  variant="solid"
                  color="primary"
                  size='lg'
                  sx={{ width: '100%' }}
                >
                  Continue
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>
      ) : (
        <Button 
          variant='solid' 
          color='neutral' 
          size='lg' 
          onClick={() => {
            // Set sessionStorage markers to indicate user has seen instructions
            // and should create a new conversation when selecting topic
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('hasSeenInstructions', 'true');
              sessionStorage.setItem('shouldCreateNewConversation', 'true');
            }
            
            // Navigate to chat page - conversation will be created when topic is selected
            router.push('/');
          }}
        >
          Got it!
        </Button>
      )}

      {/*<Typography sx={{ textAlign: 'center' }}>*/}
      {/*  Enjoy!*/}
      {/*  <br /><br />*/}
      {/*  -- The {Brand.Title.Base} Team*/}
      {/*</Typography>*/}

    </Box>
  );
}