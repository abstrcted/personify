import WorkInProgress from '../components/WorkInProgress';
import { IconHeadphones } from '@tabler/icons-react';

const ListeningHistory = () => {
  return (
    <WorkInProgress 
      title="Listening History"
      description="Explore your complete listening history and discover patterns in your music consumption."
      icon={IconHeadphones}
    />
  );
};

export default ListeningHistory;
