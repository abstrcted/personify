-- Sample data for testing the Personify database

-- Insert sample users (ignore if already exists)
INSERT OR IGNORE INTO USER (username, email) VALUES
('musiclover123', 'musiclover@example.com'),
('jazzfan', 'jazzfan@example.com'),
('rockstar99', 'rockstar@example.com'),
('popqueen', 'popqueen@example.com');

-- Insert personality traits for users
INSERT OR IGNORE INTO TRAITS (user_id, extraversion, openness, conscientiousness, agreeableness, calmness) VALUES
(1, 75, 80, 65, 70, 40),  -- High energy, outgoing
(2, 45, 90, 85, 75, 80),  -- Calm, open-minded
(3, 85, 70, 50, 60, 30),  -- Very energetic, adventurous
(4, 90, 75, 70, 80, 50);  -- Extraverted, balanced

-- Insert sample artists
INSERT OR IGNORE INTO ARTIST (artist_name, genre) VALUES
('The Energizers', 'Pop'),
('Calm Waves', 'Jazz'),
('Rock Thunder', 'Rock'),
('Dance Machine', 'Electronic'),
('Acoustic Soul', 'Folk');

-- Insert sample albums
INSERT OR IGNORE INTO ALBUM (album_name, artist_id, release_date) VALUES
('Energy Burst', 1, '2023-01-15'),
('Peaceful Dreams', 2, '2022-06-20'),
('Thunder Strikes', 3, '2023-03-10'),
('Electric Nights', 4, '2023-05-05'),
('Quiet Moments', 5, '2022-11-30');

-- Insert sample tracks
INSERT OR IGNORE INTO TRACK (track_name, track_album, duration_ms, popularity, energy, valence, danceability, acousticness, instrumentalness, speechiness, liveness, loudness, tempo) VALUES
('Party All Night', 1, 210000, 85, 0.9, 0.8, 0.85, 0.1, 0.0, 0.05, 0.2, -5.5, 128),
('Feel Good', 1, 195000, 78, 0.85, 0.9, 0.8, 0.15, 0.0, 0.04, 0.15, -6.0, 125),
('Midnight Jazz', 2, 240000, 65, 0.3, 0.5, 0.4, 0.8, 0.6, 0.03, 0.1, -12.0, 95),
('Smooth Vibes', 2, 220000, 60, 0.25, 0.6, 0.35, 0.85, 0.7, 0.02, 0.08, -13.0, 88),
('Thunder Road', 3, 255000, 82, 0.95, 0.7, 0.65, 0.05, 0.0, 0.06, 0.3, -4.0, 140),
('Electric Dreams', 4, 200000, 88, 0.88, 0.75, 0.9, 0.1, 0.2, 0.04, 0.12, -5.0, 130),
('Neon Lights', 4, 185000, 90, 0.92, 0.85, 0.95, 0.05, 0.1, 0.05, 0.15, -4.5, 132),
('Quiet Morning', 5, 270000, 55, 0.2, 0.4, 0.3, 0.95, 0.5, 0.02, 0.05, -15.0, 75),
('Sunset Melody', 5, 280000, 58, 0.18, 0.45, 0.25, 0.98, 0.6, 0.01, 0.04, -16.0, 70);

-- Link tracks to artists
INSERT OR IGNORE INTO TRACK_ARTIST (track_id, artist_id) VALUES
(1, 1), (2, 1),
(3, 2), (4, 2),
(5, 3),
(6, 4), (7, 4),
(8, 5), (9, 5);

-- Insert some user favorites
INSERT OR IGNORE INTO USER_FAVORITES (user_id, track_id) VALUES
(1, 1), (1, 6), (1, 7),  -- musiclover123 likes energetic tracks
(2, 3), (2, 4), (2, 8),  -- jazzfan likes calm tracks
(3, 5), (3, 1), (3, 6),  -- rockstar99 likes high energy
(4, 2), (4, 6), (4, 7);  -- popqueen likes dance tracks
