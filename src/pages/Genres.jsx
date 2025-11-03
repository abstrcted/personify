import WorkInProgress from '../components/WorkInProgress';
import { IconGuitarPick } from '@tabler/icons-react';

const Genres = () => {
  return (
    <WorkInProgress 
      title="Genre Analysis"
      description="Analyze your genre preferences and discover new music based on your taste."
      icon={IconGuitarPick}
    />
  );
};

export default Genres;
