import "./App.css";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SpotifyAuthProvider } from './contexts/SpotifyAuthContext';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Overview from './pages/Overview';
import ListeningHistory from './pages/ListeningHistory';
import TopTracksPage from './pages/TopTracksPage';
import TopArtists from './pages/TopArtists';
import Genres from './pages/Genres';
import Personality from './pages/Personality';
import Matching from './pages/Matching';
import Settings from './pages/Settings';
import Callback from './pages/Callback';

function App() {
  return (
    <SpotifyAuthProvider>
      <Router>
        <Routes>
          <Route path="/callback" element={<Callback />} />
          <Route path="/" element={<Dashboard />}>
            <Route index element={<Home />} />
            <Route path="overview" element={<Overview />} />
            <Route path="listening-history" element={<ListeningHistory />} />
            <Route path="top-tracks" element={<TopTracksPage />} />
            <Route path="top-artists" element={<TopArtists />} />
            <Route path="genres" element={<Genres />} />
            <Route path="personality" element={<Personality />} />
            <Route path="matching" element={<Matching />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </SpotifyAuthProvider>
  );
}

export default App;