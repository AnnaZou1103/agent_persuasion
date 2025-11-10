import * as React from 'react';
import { shallow } from 'zustand/shallow';

import { Box, FormControl, FormHelperText, FormLabel, Radio, RadioGroup, Stack, Switch } from '@mui/joy';
import TelegramIcon from '@mui/icons-material/Telegram';
import WidthNormalIcon from '@mui/icons-material/WidthNormal';
import WidthWideIcon from '@mui/icons-material/WidthWide';

import { Link } from '~/common/components/Link';
import { hideOnMobile, settingsGap } from '~/common/theme';
import { isPwa } from '~/common/util/pwaUtils';
import { useUIPreferencesStore, useUIStateStore } from '~/common/state/store-ui';


// configuration
const SHOW_PURPOSE_FINDER = false;


export function UISettings() {
  // external state
  const {
    centerMode, setCenterMode,
    doubleClickToEdit, setDoubleClickToEdit,
    enterToSend, setEnterToSend,
    renderMarkdown, setRenderMarkdown,
    showPurposeFinder, setShowPurposeFinder,
  } = useUIPreferencesStore(state => ({
    centerMode: state.centerMode, setCenterMode: state.setCenterMode,
    doubleClickToEdit: state.doubleClickToEdit, setDoubleClickToEdit: state.setDoubleClickToEdit,
    enterToSend: state.enterToSend, setEnterToSend: state.setEnterToSend,
    renderMarkdown: state.renderMarkdown, setRenderMarkdown: state.setRenderMarkdown,
    showPurposeFinder: state.showPurposeFinder, setShowPurposeFinder: state.setShowPurposeFinder,
  }), shallow);
  const { closeSettings } = useUIStateStore(state => ({ closeSettings: state.closeSettings }), shallow);

  const handleCenterModeChange = (event: React.ChangeEvent<HTMLInputElement>) => setCenterMode(event.target.value as 'narrow' | 'wide' | 'full' || 'wide');

  const handleEnterToSendChange = (event: React.ChangeEvent<HTMLInputElement>) => setEnterToSend(event.target.checked);

  const handleDoubleClickToEditChange = (event: React.ChangeEvent<HTMLInputElement>) => setDoubleClickToEdit(event.target.checked);

  const handleRenderMarkdownChange = (event: React.ChangeEvent<HTMLInputElement>) => setRenderMarkdown(event.target.checked);

  const handleShowSearchBarChange = (event: React.ChangeEvent<HTMLInputElement>) => setShowPurposeFinder(event.target.checked);

  return (

    <Stack direction='column' sx={{ gap: settingsGap }}>

      {!isPwa() && <FormControl orientation='horizontal' sx={{ ...hideOnMobile, alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <FormLabel>Centering</FormLabel>
          <FormHelperText>{centerMode === 'full' ? 'Full screen chat' : centerMode === 'narrow' ? 'Narrow chat' : 'Wide'}</FormHelperText>
        </Box>
        <RadioGroup orientation='horizontal' value={centerMode} onChange={handleCenterModeChange}>
          <Radio value='narrow' label={<WidthNormalIcon sx={{ width: 25, height: 24, mt: -0.25 }} />} />
          <Radio value='wide' label={<WidthWideIcon sx={{ width: 25, height: 24, mt: -0.25 }} />} />
          <Radio value='full' label='Full' />
        </RadioGroup>
      </FormControl>}

      <FormControl orientation='horizontal' sx={{ justifyContent: 'space-between' }}>
        <Box>
          <FormLabel>Enter to send</FormLabel>
          <FormHelperText>{enterToSend ? <>Sends message<TelegramIcon /></> : 'New line'}</FormHelperText>
        </Box>
        <Switch checked={enterToSend} onChange={handleEnterToSendChange}
                endDecorator={enterToSend ? 'On' : 'Off'}
                slotProps={{ endDecorator: { sx: { minWidth: 26 } } }} />
      </FormControl>

      <FormControl orientation='horizontal' sx={{ justifyContent: 'space-between' }}>
        <Box>
          <FormLabel>Double click to edit</FormLabel>
          <FormHelperText>{doubleClickToEdit ? 'Double click' : 'Three dots'}</FormHelperText>
        </Box>
        <Switch checked={doubleClickToEdit} onChange={handleDoubleClickToEditChange}
                endDecorator={doubleClickToEdit ? 'On' : 'Off'}
                slotProps={{ endDecorator: { sx: { minWidth: 26 } } }} />
      </FormControl>

      <FormControl orientation='horizontal' sx={{ justifyContent: 'space-between' }}>
        <Box>
          <FormLabel>Markdown</FormLabel>
          <FormHelperText>{renderMarkdown ? 'Render markdown' : 'As text'}</FormHelperText>
        </Box>
        <Switch checked={renderMarkdown} onChange={handleRenderMarkdownChange}
                endDecorator={renderMarkdown ? 'On' : 'Off'}
                slotProps={{ endDecorator: { sx: { minWidth: 26 } } }} />
      </FormControl>

      {SHOW_PURPOSE_FINDER && <FormControl orientation='horizontal' sx={{ justifyContent: 'space-between' }}>
        <Box>
          <FormLabel>Purpose finder</FormLabel>
          <FormHelperText>{showPurposeFinder ? 'Show search bar' : 'Hide search bar'}</FormHelperText>
        </Box>
        <Switch checked={showPurposeFinder} onChange={handleShowSearchBarChange}
                endDecorator={showPurposeFinder ? 'On' : 'Off'}
                slotProps={{ endDecorator: { sx: { minWidth: 26 } } }} />
      </FormControl>}

    </Stack>

  );
}