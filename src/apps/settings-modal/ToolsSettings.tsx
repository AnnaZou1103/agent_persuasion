import * as React from 'react';

import { FormHelperText, Stack } from '@mui/joy';

import { ConversationalSearchSettings } from '~/modules/pinecone/ConversationalSearchSettings';

import { settingsGap } from '~/common/theme';

export function ToolsSettings() {

  return (

    <Stack direction='column' sx={{ gap: settingsGap }}>

      <ConversationalSearchSettings />

    </Stack>

  );
}