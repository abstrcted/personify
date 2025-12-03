# Personify 🎵

A music personality matching application that connects users' personality traits with music preferences using Spotify data.

## Features

- Match music preferences with personality traits (Big Five personality model)
- Discover new artists based on your personality
- Get personalized music recommendations
- Analyze music characteristics (energy, valence, danceability, etc.)
- Track your favorite songs and artists

## Tech Stack

- **Frontend**: React 18 + Vite (SPA) / Vanilla HTML+CSS+JS (Query Interfaces)
- **Backend**: Node.js + Express.js
- **Database**: SQLite with better-sqlite3 (WAL mode)
- **Styling**: CSS3 with gradients and animations
- **APIs**: Spotify Web API, GetSongBPM API

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

4. Set up the transaction demo (optional):
```bash
node scripts/setup-transaction-demo.js
```

5. Start the backend server:
```bash
node server.js
```

6. Open your browser to:
   - Query interfaces: `http://localhost:3001/index.html`
   - React app (dev mode): `http://localhost:5173` (run `npm run dev` in separate terminal)

## Database

The application uses SQLite for data storage. The database structure includes:

- **USER**: User accounts and authentication
- **TRAITS**: Personality traits (extraversion, openness, conscientiousness, agreeableness, calmness)
- **ARTIST**: Music artist information
- **ALBUM**: Album data
- **TRACK**: Individual tracks with audio features
- **TRACK_ARTIST**: Many-to-many relationship between tracks and artists
- **USER_FAVORITES**: User's favorite tracks
- **BankAccounts**: Demo table for transaction processing
- **TransactionLog**: Audit trail for bank transfers

### Database Commands

- **Initialize database**: `node database/init.js`
- **Setup transaction demo**: `node scripts/setup-transaction-demo.js`
- **Reset database**: Delete `database/personify.db` and run init again

See [database/README.md](database/README.md) and [TRANSACTION_DEMO_README.md](TRANSACTION_DEMO_README.md) for more details.

## Project Structure

```
personify/
├── controllers/       # Backend query controllers
│   ├── query1.js     # Track lookup by artist/title
│   ├── query2.js     # Track search by keyword
│   ├── query3.js     # Browse tracks with pagination
````markdown
# Personify 🎵

Personify is a database-driven web application that explores music metadata and audio features to connect music preferences with personality traits. The codebase contains a Node/Express backend, a React (Vite) frontend, and a SQLite database with example seed data.

**Highlights**

- Six query interfaces (both static HTML and React versions) demonstrating two query patterns required by the assignment.
- Transaction demo that demonstrates atomic transfers (BEGIN/COMMIT/ROLLBACK) and logging (`BankAccounts`, `TransactionLog`).
- Uses `better-sqlite3` for a local, file-based relational database and includes schema/seed files.

**Quick Start**

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file from the example and fill in keys:

```cmd
copy .env.example .env
remind to edit .env with your Spotify / API keys
```

Note: `.env` is listed in `.gitignore` and must never be committed.

3. Initialize the database (this creates `database/personify.db` locally):

```bash
node database/init.js
```

4. (Optional) Prepare the transaction demo:

```bash
node scripts/setup-transaction-demo.js
```

5. Start the backend server (default port `3001`):

```bash
node server.js
```

6. Start the frontend dev server (Vite) in a separate terminal:

```bash
npm run dev
```

7. Open your browser:

- Static query interfaces: `http://localhost:3001/index.html`
- React app (dev): `http://localhost:5173` (or the URL printed by Vite)

**Project Structure (important files)**

- `server.js` - Express backend and route registration
- `controllers/` - `query1.js`..`query6.js` (API controller implementations)
- `public/` - static HTML query interfaces
- `src/` - React SPA source (pages/components)
- `database/` - `schema.sql`, `seed.sql`, `init.js`, and `db.js` helper
- `scripts/` - helper scripts (transaction demo setup)
- `.env.example` - template environment variables

**Database**

- Schema: `database/schema.sql`
- Seed: `database/seed.sql`
- Runtime DB file: `database/personify.db` (ignored by git)

To reset the DB: delete `database/personify.db` and re-run `node database/init.js`.

**API & Query Endpoints**

- `GET /api/db/track/:artist/:title`  — lookup track by artist and title
- `GET /api/db/search?q=keyword`       — search tracks by keyword
- `GET /api/db/browse?...`             — browse tracks (sort/limit/offset)
- `GET /api/user-stats/:userId`        — user statistics
- `POST /api/liked-songs/:userId`     — add a track to favorites
- `GET /api/transaction/accounts`      — list demo bank accounts
- `POST /api/transaction/transfer`    — perform a demo transfer (body: `{fromAccountId,toAccountId,amount,simulateError}`)

See `server.js` for exact route registration and the controllers for implementation details.

**Notes & Housekeeping**

- A `.env.example` file is provided; copy it to `.env` and populate your API keys.
- Temporary PDF extraction/debug helpers that were used during development have been neutralized and the `pdf-parse` dependency removed to avoid shipping unnecessary parsing libraries.
- If you need to remove sensitive data from git history, this requires a history rewrite — ask and I will prepare a safe plan.

**Available NPM scripts**

- `npm run dev` — start Vite dev server
- `npm run build` — build React app for production
- `npm run preview` — preview production build
- `node server.js` — start the Express backend
- `node database/init.js` — initialize/reset database

**Next Steps / Helpful Tasks I Can Do**

- Generate a Chen ERD image and add it to `docs/`
- Draft the Phase III report (3–5 pages) with screenshots and query evidence
- Produce BCNF proofs and add them to `docs/`
- Package the submission (zipped code + SQL script with example tuples)

Tell me which of the items above you'd like me to do next.

````
## License
