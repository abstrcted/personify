/* Query 1
find each users top artists based on the average popularity of the artist's tracks 
Expected Output: username | artist_name | avg_track_popularity */
SELECT 
    U.username,
    AR.artist_name,
    ROUND(AVG(T.popularity), 2) AS avg_track_popularity
FROM USER U
JOIN TRAITS TR ON U.user_id = TR.user_id
JOIN ARTIST AR ON AR.artist_id = AR.artist_id
JOIN TRACK_ARTIST TA ON AR.artist_id = TA.artist_id
JOIN TRACK T ON T.track_id = TA.track_id
GROUP BY U.username, AR.artist_name
ORDER BY avg_track_popularity DESC
LIMIT 10;

/* Query 2
find albums whose tracks have higher energy leves than average 
Expected Output: album_name | avg_energy */
SELECT 
    A.album_name,
    ROUND(AVG(T.energy), 2) AS avg_energy
FROM ALBUM A
JOIN TRACK T ON T.track_album = A.album_id
GROUP BY A.album_name
HAVING AVG(T.energy) > (
    SELECT AVG(energy) FROM TRACK
)
ORDER BY avg_energy DESC;

/* Query 3
find each users most danceable song 
Expected Output: username | track_name | danceability */
SELECT 
    U.username,
    T.track_name,
    T.danceability
FROM USER U
JOIN TRAITS TR ON U.user_id = TR.user_id
JOIN TRACK T ON 1=1
WHERE T.danceability = (
    SELECT MAX(T2.danceability)
    FROM TRACK T2
);

/* Query 4
show all albums with their tracks, including albums with no tracks and tracks without albums
Expected Output: album_name | track_name | relationship */
SELECT 
    A.album_name,
    T.track_name,
    'Album->Track' AS relationship
FROM ALBUM A
LEFT JOIN TRACK T ON A.album_id = T.track_album

UNION

SELECT 
    A.album_name,
    T.track_name,
    'Track->Album' AS relationship
FROM TRACK T
RIGHT JOIN ALBUM A ON A.album_id = T.track_album;

/* Query 5
Recommend tracks that have a similar vibe (energy + valence)
to a user's favorites but are from new artists they haven't heard.
Expected Output: username | track_name | artist_name | reason */
SELECT U.username, T.track_name, AR.artist_name, 'Similar vibe (new artist)' AS reason
FROM USER U, TRAITS TR, TRACK_ARTIST TA, ARTIST AR, TRACK T
WHERE T.track_id = TA.track_id AND AR.artist_id = TA.artist_id
  AND T.energy BETWEEN 0.6 AND 0.8 AND T.valence BETWEEN 0.6 AND 0.8
  AND T.track_name NOT IN (
      SELECT T2.track_name
      FROM TRACK T2
      WHERE T2.popularity > 75
  );

/* Query 6
artists with the highest average energy across all their tracks 
Expected Output: artist_name | avg_energy */
SELECT 
    AR.artist_name,
    ROUND(AVG(T.energy), 2) AS avg_energy
FROM ARTIST AR
JOIN TRACK_ARTIST TA ON AR.artist_id = TA.artist_id
JOIN TRACK T ON TA.track_id = T.track_id
GROUP BY AR.artist_name
ORDER BY avg_energy DESC
LIMIT 5;

/* Query 7
identify users who prefer energetic and danceable music 
Expected Output: username | avg_energy | avg_danceability | personality_tag */
SELECT 
    U.username,
    ROUND(AVG(T.energy), 2) AS avg_energy,
    ROUND(AVG(T.danceability), 2) AS avg_danceability,
    CASE 
        WHEN AVG(T.energy) > 0.7 AND AVG(T.danceability) > 0.7 THEN 'Party Lover'
        WHEN AVG(T.energy) > 0.6 THEN 'Active Listener'
        ELSE 'Calm Listener'
    END AS personality_tag
FROM USER U
JOIN TRACK_ARTIST TA ON 1=1
JOIN TRACK T ON T.track_id = TA.track_id
GROUP BY U.username
ORDER BY avg_energy DESC;

/* Query 8
Find users whose personality traits (extraversion & calmness)
best align with an artist's overall musical vibe (energy & valence).
Expected Output: artist_name | username | match_score */
SELECT AR.artist_name, U.username,
  ROUND((ABS(TR.extraversion/100 - A.avgE) + ABS(TR.calmness/100 - (1 - A.avgV)))/2, 2) AS match_score
FROM USER U JOIN TRAITS TR ON U.user_id = TR.user_id
JOIN (
  SELECT AR2.artist_id, AVG(T.energy) avgE, AVG(T.valence) avgV
  FROM ARTIST AR2 JOIN TRACK_ARTIST TA2 ON AR2.artist_id = TA2.artist_id
  JOIN TRACK T ON T.track_id = TA2.track_id GROUP BY AR2.artist_id
) A
JOIN ARTIST AR ON AR.artist_id = A.artist_id
ORDER BY match_score LIMIT 10;

/* Query 9
count how many tracks each artist has 
Expected Output: artist_name | total_tracks */
SELECT 
    AR.artist_name,
    COUNT(TA.track_id) AS total_tracks
FROM ARTIST AR
JOIN TRACK_ARTIST TA ON AR.artist_id = TA.artist_id
GROUP BY AR.artist_name
ORDER BY total_tracks DESC
LIMIT 10;

/* Query 10
Recommend artists whose average vibe matches each user's personality 
Expected Output: username | artist_name | vibe_match_score */
SELECT 
    U.username,
    AR.artist_name,
    ROUND( (ABS(TR.extraversion / 100 - AVG(T.energy)) 
          + ABS(TR.calmness / 100 - (1 - AVG(T.valence)))) / 2, 2) AS vibe_match_score
FROM USER U
JOIN TRAITS TR ON U.user_id = TR.user_id
JOIN ARTIST AR
JOIN TRACK_ARTIST TA ON AR.artist_id = TA.artist_id
JOIN TRACK T ON T.track_id = TA.track_id
GROUP BY U.username, AR.artist_name
ORDER BY vibe_match_score ASC
LIMIT 10;
