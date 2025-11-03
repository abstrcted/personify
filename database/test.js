// Test script to verify database setup
import { dbHelpers } from './db.js';

console.log('🧪 Testing Personify Database...\n');

// Test 1: Get all users
console.log('1. All Users:');
const users = dbHelpers.getAllUsers();
console.table(users);

// Test 2: Get user traits
console.log('\n2. User Traits (User ID: 1):');
const traits = dbHelpers.getUserTraits(1);
console.log(traits);

// Test 3: Get user favorites
console.log('\n3. User Favorites (User ID: 1):');
const favorites = dbHelpers.getUserFavorites(1);
console.table(favorites.map(t => ({ name: t.track_name, energy: t.energy, danceability: t.danceability })));

// Test 4: Get personality-based recommendations
console.log('\n4. Personality-Based Recommendations (User ID: 2):');
const recommendations = dbHelpers.getPersonalityBasedRecommendations(2, 5);
console.table(recommendations);

// Test 5: Get user personality tag
console.log('\n5. User Personality Tag (User ID: 1):');
const tag = dbHelpers.getUserPersonalityTag(1);
console.log(tag);

// Test 6: Get high energy albums
console.log('\n6. High Energy Albums:');
const albums = dbHelpers.getHighEnergyAlbums();
console.table(albums);

console.log('\n✅ All tests completed successfully!');
