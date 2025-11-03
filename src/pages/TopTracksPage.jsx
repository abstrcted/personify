import TopTracks from '../components/TopTracks';
import { IconMusic } from '@tabler/icons-react';
import './TopTracksPage.css';

const TopTracksPage = () => {
  return (
    <div className="top-tracks-page">
      <header className="page-header">
        <h1>
          <IconMusic size={28} stroke={2} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} />
          Your Top Tracks
        </h1>
        <p className="page-subtitle">Discover your most-played songs across different time ranges</p>
      </header>
      <TopTracks />
    </div>
  );
};

export default TopTracksPage;
