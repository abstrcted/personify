# Deployment Instructions for Remote Access

## Issues Fixed

### 1. Database Column Mismatch
- **Problem**: `db.js` was using `patience` and `hustle` columns, but `server.js` and the schema use `reflective` and `conversational`
- **Fix**: Updated `db.js` to use the correct column names matching the schema

### 2. Network Access Configuration
- **Problem**: Vite server was bound to `127.0.0.1` which prevents remote access
- **Fix**: Changed to `0.0.0.0` to allow network connections

## For Local Testing (Current Setup)

Your current `.env` configuration works for local testing on your machine:
```
FRONTEND_URI=http://127.0.0.1:5174
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3001/callback
```

## For Remote Testing (Friend Testing on Same Network)

When your friend needs to test from their computer on your network:

### Step 1: Find Your IP Address
Run this in PowerShell:
```powershell
(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi" | Select-Object -First 1).IPAddress
```
Or:
```powershell
ipconfig
```
Look for your IPv4 address (usually starts with `192.168.` or `10.`)

### Step 2: Update .env File
Replace `127.0.0.1` with your IP address:
```env
FRONTEND_URI=http://YOUR_IP_ADDRESS:5174
SPOTIFY_REDIRECT_URI=http://YOUR_IP_ADDRESS:3001/callback
```

Example:
```env
FRONTEND_URI=http://192.168.1.100:5174
SPOTIFY_REDIRECT_URI=http://192.168.1.100:3001/callback
```

### Step 3: Update Spotify App Settings
1. Go to https://developer.spotify.com/dashboard
2. Select your app
3. Click "Edit Settings"
4. Add to "Redirect URIs": `http://YOUR_IP_ADDRESS:3001/callback`
5. Click "Save"

### Step 4: Allow Firewall Access
Make sure Windows Firewall allows incoming connections on ports 3001 and 5174:
```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Personify Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Personify Frontend" -Direction Inbound -LocalPort 5174 -Protocol TCP -Action Allow
```

### Step 5: Restart Servers
1. Stop both frontend and backend servers (Ctrl+C)
2. Restart backend: `npm start`
3. Restart frontend: `npm run dev`

### Step 6: Share URL with Friend
Your friend should access: `http://YOUR_IP_ADDRESS:5174`

## For Public Deployment (Production)

For deployment to a public server or hosting service:

1. Use a proper domain name or public IP
2. Set up HTTPS (required by Spotify for production)
3. Update `.env`:
   ```env
   FRONTEND_URI=https://yourdomain.com
   SPOTIFY_REDIRECT_URI=https://yourdomain.com/api/callback
   ```
4. Update Spotify app settings with production URLs
5. Consider using environment-specific .env files:
   - `.env.development` (local)
   - `.env.staging` (testing)
   - `.env.production` (live)

## Troubleshooting

### "No routes matched location" Error
- This happens when the redirect URI doesn't match your `.env` configuration
- Make sure `FRONTEND_URI` in `.env` matches how users access the site
- Restart both servers after changing `.env`

### "Table TRAITS has no column named reflective" Error
- This has been fixed in the latest code
- If you still see this, your database might be outdated
- Run: `npm run db:reset` to rebuild the database (WARNING: This deletes all data!)

### Friend Can't Connect
1. Verify your firewall allows ports 3001 and 5174
2. Make sure you're on the same network
3. Try accessing from your own machine using your IP: `http://YOUR_IP:5174`
4. If that works, the issue is on their end (firewall, network settings)

### Spotify Authentication Fails
1. Verify redirect URI in Spotify Dashboard matches your `.env` exactly
2. Check that both servers are running
3. Look at browser console for specific error messages
4. Check server console logs for backend errors
