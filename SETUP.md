# Personify - Setup Guide

## Prerequisites
- Node.js (v18 or higher)
- npm

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/abstrcted/personify.git
cd personify
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
# Spotify API Credentials
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3001/callback

# Server Configuration
PORT=3001
FRONTEND_URI=http://127.0.0.1:5174

# GetSongBPM API (optional)
GETSONGBPM_API_KEY=your_key_here

# RAPIDAPI (optional)
RAPIDAPI_KEY=your_key_here
```

### 4. Database Setup

**Option A: Sample Data (for testing)**
```bash
npm run db:init
```
This creates a database with ~27 sample tracks.

**Option B: Full Database (1.2M songs)**
1. Download the full database: [Database Download Link - ADD YOUR LINK HERE]
2. Extract `personify.db` to the `database/` folder
3. Verify it's in the right place: `database/personify.db`

### 5. Start the Application

**Terminal 1 - Backend Server:**
```bash
npm run server
```

**Terminal 2 - Frontend Dev Server:**
```bash
npm run dev
```

### 6. Access the Application
Open your browser to: http://127.0.0.1:5174

## Features

### Without Spotify Authentication:
✅ Browse 1.2M song database
✅ Search tracks by name/artist
✅ Like/unlike songs
✅ Calculate personality profile from liked songs
✅ All database query features

### With Spotify Authentication:
✅ All above features +
✅ View your personal Top Tracks
✅ View your personal Top Artists

## Spotify API Setup (Optional)

To enable Spotify features:

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `http://127.0.0.1:3001/callback`
4. Copy Client ID and Client Secret to your `.env` file

## Troubleshooting

### Database Not Loading
- Verify `database/personify.db` exists
- Check file size (full DB should be 100MB+)
- Run `npm run db:reset` to recreate (WARNING: deletes data)

### Port Already in Use
- Change `PORT` in `.env` to a different number (e.g., 3002)
- Change frontend port in `vite.config.js`

### Spotify Login Not Working
- Verify `.env` has correct Spotify credentials
- Check redirect URI matches exactly in Spotify Dashboard
- Make sure both servers are running

## Remote Access (Testing with Friends)

See `QUICK_FIX_GUIDE.md` for instructions on enabling network access.

## Project Structure
```
personify/
├── database/          # Database files and schemas
├── src/              # React frontend
├── public/           # Static HTML pages
├── controllers/      # Backend route handlers
├── server.js         # Express backend
└── vite.config.js    # Vite configuration
```

## Available Scripts

- `npm run dev` - Start frontend dev server
- `npm run server` - Start backend server
- `npm run db:init` - Initialize database with sample data
- `npm run db:reset` - Delete and reinitialize database
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Support

For issues or questions, see:
- `QUICK_FIX_GUIDE.md` - Common problems and solutions
- `DEPLOYMENT_INSTRUCTIONS.md` - Deployment guide
- GitHub Issues - Report bugs

## Contributors

[Add your names here]

## License

[Add license information]
