# Personify Database

This directory contains the database files for the Personify music personality matching application.

## Files

- **schema.sql** - Database schema definition with all tables and indexes
- **queries.sql** - Collection of analytical queries for the application
- **seed.sql** - Sample data for testing and development
- **init.js** - Database initialization script for Node.js

## Database Structure

### Tables

1. **USER** - User accounts
2. **TRAITS** - User personality traits (Big Five personality dimensions)
3. **ARTIST** - Music artists
4. **ALBUM** - Music albums
5. **TRACK** - Individual tracks with audio features
6. **TRACK_ARTIST** - Many-to-many relationship between tracks and artists
7. **USER_FAVORITES** - User's favorite tracks

## Setup

### SQLite (Recommended for development)

1. Install SQLite:
```bash
npm install better-sqlite3
```

2. Initialize the database:
```bash
node database/init.js
```

Or manually:
```bash
sqlite3 database/personify.db < database/schema.sql
sqlite3 database/personify.db < database/seed.sql
```

### Testing Queries

You can test any query from `queries.sql`:
```bash
sqlite3 database/personify.db < database/queries.sql
```

Or interactively:
```bash
sqlite3 database/personify.db
sqlite> .read database/schema.sql
sqlite> .read database/seed.sql
sqlite> SELECT * FROM USER;
```

## Integration with Application

The database is designed to work with the React/Vite frontend. You'll need to:

1. Set up a backend API (Express.js recommended)
2. Install database dependencies
3. Create API endpoints for data operations
4. Connect to Spotify API for real music data

## Next Steps

- [ ] Set up backend server
- [ ] Install database packages
- [ ] Create API routes
- [ ] Integrate with Spotify API
- [ ] Build React components to display data
