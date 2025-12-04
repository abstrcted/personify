# Personality Traits Feature

This feature calculates music personality traits based on a user's liked songs and their audio features.

## Overview

The system analyzes your listening habits to determine 12 personality traits across 6 dimensions, where each dimension has a primary trait and its opposite:

### Trait Dimensions

1. **Patience ↔ Hustle**
   - Based on average song duration
   - Higher patience = preference for longer, more immersive songs
   - Higher hustle = preference for quick, energetic music

2. **Moodiness ↔ Joyfulness**
   - Based on track valence (emotional positivity)
   - Higher moodiness = preference for melancholic, introspective music
   - Higher joyfulness = preference for upbeat, positive music

3. **Openness ↔ Balance**
   - Based on artist variety relative to total tracks
   - Higher openness = wide variety of artists explored
   - Higher balance = sticking with familiar favorites

4. **Chaoticness ↔ Calmness**
   - Based on energy, danceability, and valence
   - Higher chaoticness = preference for intense, energetic music
   - Higher calmness = preference for peaceful, steady music

5. **Extraversion ↔ Introspection**
   - Based on valence and danceability
   - Higher extraversion = preference for social, danceable music
   - Higher introspection = preference for personal, reflective music

6. **Whimsy ↔ Groundedness**
   - Based on acousticness and instrumentalness
   - Higher whimsy = preference for ethereal, instrumental music
   - Higher groundedness = preference for straightforward, produced music

## Calculation Formulas

### Patience (0-100)
```
patience = min(100, max(0, ((avg_duration_ms - 120000) / 240000) * 100))
```
Normalizes song duration where 2 min = 0%, 6 min = 100%

### Moodiness (0-100)
```
moodiness = (1 - avg_valence) * 100
```
Inverse of valence: lower valence = higher moodiness

### Openness (0-100)
```
openness = min(100, (unique_artists / total_tracks) * 150)
```
Artist diversity metric, capped at 100%

### Chaoticness (0-100)
```
chaoticness = (avg_energy * 0.4 + avg_danceability * 0.4 + avg_valence * 0.2) * 100
```
Weighted combination of energetic features

### Extraversion (0-100)
```
extraversion = (avg_valence * 0.6 + avg_danceability * 0.4) * 100
```
Social music preference metric

### Whimsy (0-100)
```
whimsy = max(avg_acousticness, avg_instrumentalness) * 100
```
Takes the higher of acoustic or instrumental preference

### Opposite Traits
Each opposite trait is simply:
```
opposite_trait = 100 - primary_trait
```

## Database Schema

### TRAITS Table
```sql
CREATE TABLE IF NOT EXISTS TRAITS (
    trait_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    -- Primary traits
    patience INTEGER CHECK(patience >= 0 AND patience <= 100),
    moodiness INTEGER CHECK(moodiness >= 0 AND moodiness <= 100),
    openness INTEGER CHECK(openness >= 0 AND openness <= 100),
    chaoticness INTEGER CHECK(chaoticness >= 0 AND chaoticness <= 100),
    extraversion INTEGER CHECK(extraversion >= 0 AND extraversion <= 100),
    whimsy INTEGER CHECK(whimsy >= 0 AND whimsy <= 100),
    -- Opposite traits
    balance INTEGER CHECK(balance >= 0 AND balance <= 100),
    calmness INTEGER CHECK(calmness >= 0 AND calmness <= 100),
    groundedness INTEGER CHECK(groundedness >= 0 AND groundedness <= 100),
    introspection INTEGER CHECK(introspection >= 0 AND introspection <= 100),
    joyfulness INTEGER CHECK(joyfulness >= 0 AND joyfulness <= 100),
    hustle INTEGER CHECK(hustle >= 0 AND hustle <= 100),
    -- Legacy/future traits
    conscientiousness INTEGER CHECK(conscientiousness >= 0 AND conscientiousness <= 100),
    agreeableness INTEGER CHECK(agreeableness >= 0 AND agreeableness <= 100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE
);
```

## API Endpoints

### GET /api/user-traits
Fetch existing traits for a user.

**Query Parameters:**
- `userId` (optional, defaults to 1)

**Response:**
```json
{
  "trait_id": 1,
  "user_id": 1,
  "patience": 65,
  "moodiness": 42,
  "openness": 78,
  "chaoticness": 55,
  "extraversion": 70,
  "whimsy": 35,
  "balance": 22,
  "calmness": 45,
  "groundedness": 65,
  "introspection": 30,
  "joyfulness": 58,
  "hustle": 35,
  "conscientiousness": 50,
  "agreeableness": 50,
  "updated_at": "2025-12-03T10:30:00.000Z"
}
```

**Error Responses:**
- `404`: No traits found for user
- `500`: Server error

### POST /api/calculate-traits
Calculate and save personality traits based on user's liked songs.

**Query Parameters:**
- `userId` (optional, defaults to 1)

**Response:**
Same as GET /api/user-traits

**Error Responses:**
- `400`: Not enough track data (user needs liked songs)
- `500`: Server error

## Files Modified/Created

### Database
- `database/schema.sql` - Updated TRAITS table structure
- `database/db.js` - Added `calculateUserTraits()` function
- `scripts/migrate-traits.js` - Migration script for existing databases

### Backend
- `src/services/databaseService.js` - Added `calculateAndSaveTraits()` and `getUserTraits()`
- `server.js` - Added `/api/user-traits` and `/api/calculate-traits` endpoints

### Frontend
- `src/pages/Personality.jsx` - Complete personality profile UI
- `src/pages/Personality.css` - Styling for personality page

## Setup Instructions

### 1. Run Migration (for existing databases)
```bash
node scripts/migrate-traits.js
```

### 2. Or Reinitialize Database (fresh start)
```bash
node database/init.js
```

### 3. Start Server
```bash
npm run dev
```

### 4. Navigate to Personality Page
Visit `/personality` in your app and click "Calculate My Traits"

## Requirements

To calculate traits, a user must have:
- At least 1 liked song in the database
- Songs with complete audio features (energy, valence, danceability, etc.)

## Usage Example

```javascript
// Calculate traits for user
const response = await fetch('/api/calculate-traits?userId=1', {
  method: 'POST'
});
const traits = await response.json();
console.log('Extraversion:', traits.extraversion);

// Fetch existing traits
const existing = await fetch('/api/user-traits?userId=1');
const savedTraits = await existing.json();
```

## Future Enhancements

- Add `conscientiousness` calculation based on playlist organization
- Add `agreeableness` calculation based on genre overlap with friends
- Personality-based music recommendations
- Trait comparison between users for matching
- Historical trait changes over time
- More sophisticated formulas with machine learning
