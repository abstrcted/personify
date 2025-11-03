import WorkInProgress from '../components/WorkInProgress';
import { IconMicrophone } from '@tabler/icons-react';

const TopArtists = () => {
  return (
    <WorkInProgress
      title="Top Artists"
      description="See your favorite artists ranked by play count across different time ranges and discover new artists similar to your taste."
      icon={IconMicrophone}
    />
  );
};

export default TopArtists;
