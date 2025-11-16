# Personify 🎵

A music personality matching application that connects users' personality traits with music preferences using Spotify data.

## Features

- Match music preferences with personality traits (Big Five personality model)
- Discover new artists based on your personality
- Get personalized music recommendations
- Analyze music characteristics (energy, valence, danceability, etc.)
- Track your favorite songs and artists

## Tech Stack

- **Frontend**: React + Vite
- **Database**: SQLite (better-sqlite3)
- **Styling**: Bootstrap 5 + React Bootstrap

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/abstrcted/personify.git
cd personify
```

2. Install dependencies:
```bash
npm install
```

3. Initialize the database:
```bash
node database/init.js
```

4. Start the development server:
```bash
npm run dev
```

## Database

The application uses SQLite for data storage. The database structure includes:

- **Users**: User accounts and authentication
- **Traits**: Personality traits (extraversion, openness, conscientiousness, agreeableness, calmness)
- **Artists**: Music artist information
- **Albums**: Album data
- **Tracks**: Individual tracks with audio features
- **Track_Artist**: Many-to-many relationship between tracks and artists
- **User_Favorites**: User's favorite tracks

### Database Commands

- **Initialize database**: `node database/init.js`
- **Test database**: `node database/test.js`
- **Reset database**: Delete `database/personify.db` and run init again

See [database/README.md](database/README.md) for more details.

## Project Structure

```
personify/
├── database/           # Database files and scripts
│   ├── schema.sql     # Database schema
│   ├── queries.sql    # Analytical queries
│   ├── seed.sql       # Sample data
│   ├── init.js        # Database initialization
│   ├── db.js          # Database helper functions
│   └── test.js        # Database tests
├── src/               # React source files
│   ├── App.jsx
│   └── main.jsx
├── public/            # Static assets
└── index.html

```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Next Steps

- [ ] Set up backend API server (Express.js)
- [ ] Integrate Spotify API
- [ ] Create authentication system
- [ ] Build React components for UI
- [ ] Add personality assessment quiz
- [ ] Implement recommendation algorithm

## Credits

This project uses the [GetSongBPM API](https://getsongbpm.com/api) for audio features and the Spotify Web API for music data.

See [CREDITS.md](CREDITS.md) for full acknowledgments.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.
