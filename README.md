# Personify 🎵

A database-driven music application that analyzes your listening preferences and generates personality insights based on song characteristics. Browse our 1.2M song database, like tracks, and discover your musical personality - no Spotify required for core features!

## ✨ Features

### Available Without Spotify
- 🎵 Browse and search **1.2M songs** from our database
- ❤️ Like/unlike songs to build your personal collection
- 🧠 Calculate **personality profiles** from your liked songs
- 📊 View audio feature analysis (energy, valence, danceability, etc.)
- 🔍 Access all database query interfaces

### Spotify-Only Features
- 📈 View your personal **Top Tracks** from Spotify
- 🎤 View your personal **Top Artists** from Spotify

## 🚀 Quick Start

### Prerequisites
- **Node.js** v16 or higher
- **npm** or yarn

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/abstrcted/personify.git
cd personify
```

2. **Install dependencies:**
```bash
npm install
```

3. **Download the full database** (1.2M songs):
   - Download: [**Personify Database - Google Drive Link**](YOUR_GOOGLE_DRIVE_LINK_HERE)
   - Extract `personify.db` to the `database/` folder
   - Verify the file is at: `database/personify.db`

4. **Create `.env` file** in the root directory:
```env
# Spotify API Credentials (Optional - only needed for Top Tracks/Artists)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3001/callback

# Server Configuration
PORT=3001
FRONTEND_URI=http://127.0.0.1:5174

# Optional API Keys
GETSONGBPM_API_KEY=your_key_here
RAPIDAPI_KEY=your_key_here
```

5. **Start the backend server:**
```bash
npm run server
```
You should see: `Server running on port 3001`

6. **Start the frontend** (in a new terminal):
```bash
npm run dev
```
You should see: `Local: http://localhost:5174/`

7. **Open your browser:**
```
http://127.0.0.1:5174
```

## 🎯 Usage

### Without Spotify Login:
1. Open the app
2. Browse/search the 1.2M song database
3. Click ❤️ to like songs you enjoy
4. Navigate to "Personality Profile" to see insights
5. Explore all query pages

### With Spotify Login:
1. Click "Connect with Spotify" on the home page
2. Authorize the app
3. Access "Top Tracks" and "Top Artists" pages
4. All other features remain available

## 📁 Project Structure

```
personify/
├── database/
│   ├── personify.db      # SQLite database (download separately)
│   ├── schema.sql        # Database schema
│   ├── seed.sql          # Sample seed data
│   ├── init.js           # Database initialization script
│   └── db.js             # Database helper functions
├── src/
│   ├── pages/            # React pages
│   │   ├── Home.jsx      # Main database browser
│   │   ├── Personality.jsx  # Personality insights
│   │   ├── TopTracksPage.jsx    # Spotify top tracks
│   │   ├── TopArtists.jsx   # Spotify top artists
│   │   └── Query1-6.jsx     # Database query demos
│   ├── components/       # Reusable React components
│   ├── contexts/         # React context (Spotify auth)
│   └── services/         # API service layer
├── controllers/          # Backend API controllers
│   ├── query1.js        # Track lookup by artist/title
│   ├── query2.js        # Search tracks
│   ├── query3.js        # Browse with pagination
│   ├── query4.js        # User statistics
│   ├── query5.js        # Add favorites
│   └── query6.js        # Transaction demo
├── public/              # Static HTML query interfaces
├── server.js            # Express backend server
├── vite.config.js       # Vite configuration
└── package.json         # Dependencies and scripts
```

## 🗄️ Database

**Schema Overview:**
- **USER** - User accounts
- **TRAITS** - Personality trait calculations
- **ARTIST** - Music artists (1.2M+ entries)
- **ALBUM** - Albums
- **TRACK** - Individual tracks with audio features
- **TRACK_ARTIST** - Many-to-many artist-track relationships
- **USER_FAVORITES** - User's liked songs
- **BankAccounts** - Transaction demo accounts
- **TransactionLog** - Transaction audit trail

**Database Commands:**
```bash
npm run db:init    # Initialize with sample data
npm run db:reset   # Delete and reinitialize (⚠️ loses data)
```

## 🔌 API Endpoints

### Database Queries (No Auth Required)
- `GET /api/db/track/:artist/:title` - Lookup track
- `GET /api/db/search?q=query` - Search tracks
- `GET /api/db/browse?sort=field&limit=50&offset=0` - Browse tracks
- `GET /api/db/stats` - Database statistics
- `GET /api/db/random?limit=50` - Random tracks

### User Features (No Auth Required)
- `GET /api/liked-songs/:userId` - Get user's liked songs
- `POST /api/liked-songs/:userId` - Add liked song
- `DELETE /api/liked-songs/:userId/:trackId` - Remove liked song
- `GET /api/user-stats/:userId` - User statistics
- `POST /api/calculate-traits?userId=1` - Calculate personality

### Spotify Features (Auth Required)
- `GET /login` - Initiate Spotify OAuth
- `GET /callback` - OAuth callback
- `GET /top-tracks` - User's top tracks
- `GET /top-artists` - User's top artists

### Transaction Demo
- `GET /api/transaction/accounts` - List accounts
- `POST /api/transaction/transfer` - Transfer funds

## 🔧 Configuration

### For Local Development
Use the default `.env` settings (already set up for `127.0.0.1`)

### For Network Access (Testing with Friends)
See `QUICK_FIX_GUIDE.md` for detailed instructions on:
- Finding your IP address
- Updating `.env` with your network IP
- Configuring Spotify redirect URIs
- Setting up firewall rules

### Spotify API Setup (Optional)
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `http://127.0.0.1:3001/callback`
4. Copy Client ID and Secret to `.env`

## 📜 Available Scripts

```bash
npm run dev          # Start Vite dev server
npm run server       # Start Express backend
npm run build        # Build for production
npm run preview      # Preview production build
npm run db:init      # Initialize database with sample data
npm run db:reset     # Delete and reinitialize database
```

## 🐛 Troubleshooting

### Database Not Loading
- Verify `database/personify.db` exists and is ~100MB+
- Check backend console for errors
- Try `npm run db:reset` (⚠️ deletes all data)

### CORS Errors
- Make sure both servers are running
- Hard refresh browser (Ctrl+Shift+R)
- Clear browser cache completely

### Port Already in Use
- Change `PORT=3001` in `.env` to another port
- Update `vite.config.js` proxy target to match

### Friend Can't Access
- Follow instructions in `QUICK_FIX_GUIDE.md`
- Make sure you're on the same network
- Check firewall settings

## 📚 Documentation

- `SETUP.md` - Detailed setup instructions
- `QUICK_FIX_GUIDE.md` - Common issues and solutions
- `DEPLOYMENT_INSTRUCTIONS.md` - Remote access setup
- `database/README.md` - Database schema details
- `docs/SPOTIFY_OPTIONAL_IMPLEMENTATION.md` - Feature requirements

## 🤝 Contributing

This is a course project for database systems. If you'd like to contribute:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

[Add your license here]

## 🙏 Acknowledgments

- **Spotify Web API** - Music data and user listening history
- **GetSongBPM API** - Audio feature enrichment
- **RapidAPI Track Analysis** - Additional audio features

## 📞 Support

For issues or questions:
- Check `QUICK_FIX_GUIDE.md` for common solutions
- Review existing GitHub Issues
- Create a new issue with detailed information

---

**Built with** ❤️ **for CS Database Systems**
