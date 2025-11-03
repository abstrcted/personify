import WorkInProgress from '../components/WorkInProgress';
import { IconChartBar } from '@tabler/icons-react';

const Overview = () => {
  return (
    <WorkInProgress 
      title="Analytics Overview"
      description="View comprehensive analytics about your listening habits and personality insights."
      icon={IconChartBar}
    />
  );
};

export default Overview;
