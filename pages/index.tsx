import * as React from 'react';
import { useRouter } from 'next/router';

import { AppChat } from '../src/apps/chat/AppChat';
import { useShowNewsOnUpdate } from '../src/apps/news/news.hooks';
import { useStudyIdStore } from '~/common/state/store-study-id';

import { AppLayout } from '~/common/layout/AppLayout';


export default function ChatPage() {
  const router = useRouter();
  const studyId = useStudyIdStore(state => state.studyId);
  
  // show the News page on updates
  useShowNewsOnUpdate();

  // Redirect to news page if no study ID is set
  React.useEffect(() => {
    if (!studyId && router.pathname === '/') {
      router.replace('/news');
    }
  }, [studyId, router]);

  // Redirect to news page if study ID is set but user hasn't seen instructions in this session
  React.useEffect(() => {
    if (studyId && router.pathname === '/') {
      const hasSeenInstructions = typeof window !== 'undefined' && sessionStorage.getItem('hasSeenInstructions') === 'true';
      if (!hasSeenInstructions) {
        router.replace('/news');
      }
    }
  }, [studyId, router]);

  // Don't render chat if no study ID (will redirect to news)
  if (!studyId) {
    return null;
  }

  // Don't render chat if user hasn't seen instructions (will redirect to news)
  if (typeof window !== 'undefined' && sessionStorage.getItem('hasSeenInstructions') !== 'true') {
    return null;
  }

  return (
    <AppLayout>
      <AppChat />
    </AppLayout>
  );
}