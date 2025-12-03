import "./App.css";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SpotifyAuthProvider } from './contexts/SpotifyAuthContext';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Overview from './pages/Overview';
import ListeningHistory from './pages/ListeningHistory';
import TopTracksPage from './pages/TopTracksPage';
import TopArtists from './pages/TopArtists';
import Personality from './pages/Personality';
import Settings from './pages/Settings';
import Callback from './pages/Callback';
import Query1 from './pages/Query1';
import Query2 from './pages/Query2';
import Query3 from './pages/Query3';
import Query4 from './pages/Query4';
import Query5 from './pages/Query5';
import Query6 from './pages/Query6';

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
            <Route path="personality" element={<Personality />} />
            <Route path="settings" element={<Settings />} />
            <Route path="query1" element={<Query1 />} />
            <Route path="query2" element={<Query2 />} />
            <Route path="query3" element={<Query3 />} />
            <Route path="query4" element={<Query4 />} />
            <Route path="query5" element={<Query5 />} />
            <Route path="query6" element={<Query6 />} />
          </Route>
        </Routes>
      </Router>
    </SpotifyAuthProvider>
  );
}

export default App;