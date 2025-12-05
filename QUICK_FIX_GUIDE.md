# Quick Fix Guide for Friend Testing Issues

## Problems Identified

### 1. ❌ Blank Page After Spotify Login
**Cause**: The app redirects to `http://127.0.0.1:5174/callback` which only works on your computer, not your friend's.

**Fix**: Update `.env` to use your network IP address instead of `127.0.0.1`

### 2. ❌ "Table TRAITS has no column named reflective" Error  
**Cause**: Code mismatch between `db.js` (using old column names) and `server.js` (using new column names).

**Fix**: ✅ Already fixed! Updated `db.js` to use correct column names.

---

## Steps to Enable Friend Testing

### Quick Setup (5 minutes)

1. **Find Your IP Address**
   ```powershell
   ipconfig
   ```
   Look for IPv4 Address (e.g., `192.168.1.100`)

2. **Update `.env` File**
   Change these two lines:
   ```env
   FRONTEND_URI=http://YOUR_IP:5174
   SPOTIFY_REDIRECT_URI=http://YOUR_IP:3001/callback
   ```
   
   Example:
   ```env
   FRONTEND_URI=http://192.168.1.100:5174
   SPOTIFY_REDIRECT_URI=http://192.168.1.100:3001/callback
   ```

3. **Update Spotify Dashboard**
   - Go to https://developer.spotify.com/dashboard
   - Open your app → Edit Settings
   - Add to Redirect URIs: `http://YOUR_IP:3001/callback`
   - Save

4. **Allow Firewall (Run PowerShell as Admin)**
   ```powershell
   New-NetFirewallRule -DisplayName "Personify Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
   New-NetFirewallRule -DisplayName "Personify Frontend" -Direction Inbound -LocalPort 5174 -Protocol TCP -Action Allow
   ```

5. **Restart Both Servers**
   - Stop with Ctrl+C
   - Backend: `npm run server`
   - Frontend: `npm run dev`

6. **Share URL with Friend**
   - `http://YOUR_IP:5174`

---

## Testing Locally Again?

To switch back to local-only testing:

1. **Restore `.env`**
   ```env
   FRONTEND_URI=http://127.0.0.1:5174
   SPOTIFY_REDIRECT_URI=http://127.0.0.1:3001/callback
   ```

2. **Restart servers**

3. **Access at**: `http://127.0.0.1:5174`

---

## Common Issues

### Issue: Friend sees "No routes matched location"
- **Check**: Your friend is using `http://YOUR_IP:5174`, not `http://127.0.0.1:5174`
- **Check**: You restarted both servers after changing `.env`

### Issue: Friend can't connect at all
- **Check**: Both computers on same Wi-Fi network
- **Check**: Firewall rules added (see step 4 above)
- **Test**: Try accessing `http://YOUR_IP:5174` from your own computer

### Issue: Spotify login fails
- **Check**: Redirect URI in Spotify Dashboard matches `.env` exactly (including port!)
- **Check**: Both servers are running
- **Check**: Browser console for specific errors

### Issue: Database errors persist
Run this to reset the database:
```powershell
npm run db:reset
```
⚠️ **Warning**: This deletes all users and data!

---

## Files That Were Fixed

✅ `database/db.js` - Updated to use correct TRAITS column names  
✅ `vite.config.js` - Changed host to `0.0.0.0` for network access  
✅ `package.json` - Added database reset scripts  
📄 `DEPLOYMENT_INSTRUCTIONS.md` - Full detailed guide created  

---

## Still Having Issues?

Check the full detailed guide: `DEPLOYMENT_INSTRUCTIONS.md`
