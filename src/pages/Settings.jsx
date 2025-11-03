import WorkInProgress from '../components/WorkInProgress';
import { IconSettings } from '@tabler/icons-react';

const Settings = () => {
  return (
    <WorkInProgress 
      title="Settings"
      description="Manage your account preferences, privacy settings, and app configuration."
      icon={IconSettings}
    />
  );
};

export default Settings;
