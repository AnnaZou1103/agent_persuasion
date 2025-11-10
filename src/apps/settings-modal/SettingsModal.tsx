import * as React from 'react';

import { Divider } from '@mui/joy';

import { GoodModal } from '~/common/components/GoodModal';
import { useUIStateStore } from '~/common/state/store-ui';

import { UISettings } from './UISettings';


/**
 * Component that allows the User to modify the application settings,
 * persisted on the client via localStorage.
 */
export function SettingsModal() {
  // external state
  const { settingsOpenTab, closeSettings } = useUIStateStore();

  return (
    <GoodModal
      title='Preferences' strongerTitle
      open={!!settingsOpenTab} onClose={closeSettings}
      sx={{ p: { xs: 1, sm: 2, lg: 2.5 } }}
    >

      {/*<Divider />*/}

      {/* Settings content - Tools tab removed for experiment */}
      <UISettings />

      <Divider />

    </GoodModal>
  );
}
