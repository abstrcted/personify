// Example usage of database helpers in your application
// This file shows how to use the database functions

import { dbHelpers } from '../database/db.js';

// === USER OPERATIONS ===

// Get a user by ID
const user = dbHelpers.getUser(1);
console.log(user);
// { user_id: 1, username: 'musiclover123', email: '...', created_at: '...' }

// Get a user by username
const userByName = dbHelpers.getUserByUsername('jazzfan');
console.log(userByName);

// Create a new user
const newUserId = dbHelpers.createUser('newuser', 'newuser@example.com');
console.log(`Created user with ID: ${newUserId}`);

// Get all users
const allUsers = dbHelpers.getAllUsers();
console.log(allUsers);

// === PERSONALITY TRAITS ===

// Get user's personality traits
const traits = dbHelpers.getUserTraits(1);
console.log(traits);
// { trait_id: 1, user_id: 1, extraversion: 75, openness: 80, ... }

// Set/update user's personality traits
dbHelpers.setUserTraits(1, {
  extraversion: 80,
  openness: 75,
  conscientiousness: 70,
  agreeableness: 85,
  calmness: 50
});

// === MUSIC DATA ===

// Search for artists
const artists = dbHelpers.searchArtists('Wave');
console.log(artists);

// Get tracks by artist
const artistTracks = dbHelpers.getTracksByArtist(1);
console.log(artistTracks);

// Search for tracks
const tracks = dbHelpers.searchTracks('Party');
console.log(tracks);

// === USER FAVORITES ===

// Get user's favorite tracks
const favorites = dbHelpers.getUserFavorites(1);
console.log(favorites);

// Add a favorite track
dbHelpers.addFavorite(1, 5); // userId: 1, trackId: 5

// Remove a favorite track
dbHelpers.removeFavorite(1, 5);

// === RECOMMENDATIONS ===

// Get personality-based artist recommendations
const recommendations = dbHelpers.getPersonalityBasedRecommendations(2, 10);
console.log(recommendations);
// Returns artists sorted by how well they match user's personality

// Get user's personality tag based on listening habits
const personalityTag = dbHelpers.getUserPersonalityTag(1);
console.log(personalityTag);
// { username: '...', avg_energy: 0.9, personality_tag: 'Party Lover' }

// Get top artists by user
const topArtists = dbHelpers.getTopArtistsByUser(1, 5);
console.log(topArtists);

// Get high energy albums
const highEnergyAlbums = dbHelpers.getHighEnergyAlbums();
console.log(highEnergyAlbums);

// === EXAMPLE: Building a React Component ===

/*
// UserProfile.jsx
import { useEffect, useState } from 'react';
import { dbHelpers } from '../database/db.js';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [traits, setTraits] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    // Load user data
    const userData = dbHelpers.getUser(userId);
    setUser(userData);

    // Load personality traits
    const traitsData = dbHelpers.getUserTraits(userId);
    setTraits(traitsData);

    // Load recommendations
    const recs = dbHelpers.getPersonalityBasedRecommendations(userId, 5);
    setRecommendations(recs);
  }, [userId]);

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h1>{user.username}</h1>
      
      {traits && (
        <div>
          <h2>Personality Traits</h2>
          <p>Extraversion: {traits.extraversion}</p>
          <p>Openness: {traits.openness}</p>
          <p>Calmness: {traits.calmness}</p>
        </div>
      )}

      <div>
        <h2>Recommended Artists</h2>
        <ul>
          {recommendations.map(rec => (
            <li key={rec.artist_name}>
              {rec.artist_name} (Match Score: {rec.vibe_match_score})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default UserProfile;
*/
