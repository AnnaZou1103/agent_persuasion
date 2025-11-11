import * as React from 'react';
import { shallow } from 'zustand/shallow';

import { ListItemButton, ListItemDecorator } from '@mui/joy';
import CallIcon from '@mui/icons-material/Call';
import PhoneForwardedIcon from '@mui/icons-material/PhoneForwarded';

import { SystemPurposeId, SystemPurposes } from '../../../../data';

import { AppBarDropdown } from '~/common/layout/AppBarDropdown';
import { useChatStore } from '~/common/state/store-chats';
import { useUIPreferencesStore } from '~/common/state/store-ui';


function AppBarPersonaDropdown(props: {
  systemPurposeId: SystemPurposeId | null,
  setSystemPurposeId: (systemPurposeId: SystemPurposeId | null) => void,
  onCall?: () => void,
}) {

  // external state
  const { experimentalLabs, zenMode } = useUIPreferencesStore(state => ({
    experimentalLabs: state.experimentalLabs,
    zenMode: state.zenMode,
  }), shallow);

  const handleSystemPurposeChange = (_event: any, value: SystemPurposeId | null) => props.setSystemPurposeId(value);


  // options

  let appendOption: React.JSX.Element | undefined = undefined;

  if (experimentalLabs && props.onCall) {
    const enableCallOption = !!props.systemPurposeId;
    appendOption = (
      <ListItemButton disabled={!enableCallOption} key='menu-call-persona' onClick={props.onCall} sx={{ minWidth: 160 }}>
        <ListItemDecorator>{enableCallOption ? <PhoneForwardedIcon color='success' /> : <CallIcon color='warning' />}</ListItemDecorator>
        Call {props.systemPurposeId ? SystemPurposes[props.systemPurposeId]?.symbol : ''}
      </ListItemButton>
    );
  }

  return (
    <AppBarDropdown
      items={SystemPurposes} showSymbols={zenMode !== 'cleaner'}
      value={props.systemPurposeId} onChange={handleSystemPurposeChange}
      appendOption={appendOption}
    />
  );

}

export function usePersonaIdDropdown(conversationId: string | null) {

  // Simplified: Always use 'conv_search' persona
  const systemPurposeId: SystemPurposeId = 'conv_search';

  const personaDropdown = React.useMemo(() => conversationId
      ? <AppBarPersonaDropdown
        systemPurposeId={systemPurposeId}
        setSystemPurposeId={() => {
          // No-op: only one persona available
        }}
      /> : null,
    [conversationId],
  );

  return { personaDropdown };
}