-- Personify Database Schema
-- Music personality matching application

-- Users table
CREATE TABLE IF NOT EXISTS USER (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User personality traits
CREATE TABLE IF NOT EXISTS TRAITS (
    trait_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    extraversion INTEGER CHECK(extraversion >= 0 AND extraversion <= 100),
    openness INTEGER CHECK(openness >= 0 AND openness <= 100),
    conscientiousness INTEGER CHECK(conscientiousness >= 0 AND conscientiousness <= 100),
    agreeableness INTEGER CHECK(agreeableness >= 0 AND agreeableness <= 100),
    calmness INTEGER CHECK(calmness >= 0 AND calmness <= 100),
    FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE
);

-- Artists table
CREATE TABLE IF NOT EXISTS ARTIST (
    artist_id INTEGER PRIMARY KEY AUTOINCREMENT,
    artist_name VARCHAR(255) NOT NULL,
    spotify_id VARCHAR(100) UNIQUE,
    genre VARCHAR(100)
);

-- Albums table
CREATE TABLE IF NOT EXISTS ALBUM (
    album_id INTEGER PRIMARY KEY AUTOINCREMENT,
    album_name VARCHAR(255) NOT NULL,
    artist_id INTEGER,
    release_date DATE,
    spotify_id VARCHAR(100) UNIQUE,
    FOREIGN KEY (artist_id) REFERENCES ARTIST(artist_id) ON DELETE SET NULL
);

-- Tracks table
CREATE TABLE IF NOT EXISTS TRACK (
    track_id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_name VARCHAR(255) NOT NULL,
    track_album INTEGER,
    duration_ms INTEGER,
    popularity INTEGER CHECK(popularity >= 0 AND popularity <= 100),
    spotify_id VARCHAR(100) UNIQUE,
    -- Audio features
    energy REAL CHECK(energy >= 0 AND energy <= 1),
    valence REAL CHECK(valence >= 0 AND valence <= 1),
    danceability REAL CHECK(danceability >= 0 AND danceability <= 1),
    acousticness REAL CHECK(acousticness >= 0 AND acousticness <= 1),
    instrumentalness REAL CHECK(instrumentalness >= 0 AND instrumentalness <= 1),
    speechiness REAL CHECK(speechiness >= 0 AND speechiness <= 1),
    liveness REAL CHECK(liveness >= 0 AND liveness <= 1),
    loudness REAL,
    tempo REAL,
    FOREIGN KEY (track_album) REFERENCES ALBUM(album_id) ON DELETE SET NULL
);

-- Track-Artist relationship (many-to-many)
CREATE TABLE IF NOT EXISTS TRACK_ARTIST (
    track_id INTEGER NOT NULL,
    artist_id INTEGER NOT NULL,
    PRIMARY KEY (track_id, artist_id),
    FOREIGN KEY (track_id) REFERENCES TRACK(track_id) ON DELETE CASCADE,
    FOREIGN KEY (artist_id) REFERENCES ARTIST(artist_id) ON DELETE CASCADE
);

-- User favorite tracks (optional)
CREATE TABLE IF NOT EXISTS USER_FAVORITES (
    user_id INTEGER NOT NULL,
    track_id INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, track_id),
    FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES TRACK(track_id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_track_album ON TRACK(track_album);
CREATE INDEX IF NOT EXISTS idx_track_energy ON TRACK(energy);
CREATE INDEX IF NOT EXISTS idx_track_valence ON TRACK(valence);
CREATE INDEX IF NOT EXISTS idx_track_danceability ON TRACK(danceability);
CREATE INDEX IF NOT EXISTS idx_track_popularity ON TRACK(popularity);
CREATE INDEX IF NOT EXISTS idx_traits_user ON TRAITS(user_id);
CREATE INDEX IF NOT EXISTS idx_track_artist_track ON TRACK_ARTIST(track_id);
CREATE INDEX IF NOT EXISTS idx_track_artist_artist ON TRACK_ARTIST(artist_id);
