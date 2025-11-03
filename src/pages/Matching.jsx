import WorkInProgress from '../components/WorkInProgress';
import { IconUsers } from '@tabler/icons-react';

const Matching = () => {
  return (
    <WorkInProgress
      title="Find Your Match"
      description="Connect with users who share similar personality traits and musical preferences. Discover your musical soulmates!"
      icon={IconUsers}
    />
  );
};

export default Matching;
