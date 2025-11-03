import WorkInProgress from '../components/WorkInProgress';
import { IconSparkles } from '@tabler/icons-react';

const Personality = () => {
  return (
    <WorkInProgress
      title="Personality Profile"
      description="Take our personality quiz and discover how your music taste aligns with the Big Five personality traits: Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism."
      icon={IconSparkles}
    />
  );
};

export default Personality;
