# Higgins

A family command center: home upkeep, vehicles, bills, meals & recipes, calendar, things to buy, and estate planning — with type-or-speak quick capture.

## Install on iPhone / iPad
1. Open the site in **Safari**.
2. Tap **Share → Add to Home Screen**.
3. Launch Higgins from the home screen icon. It runs full screen and works offline.

## Where data lives
All data stays **on the device** (browser storage). Nothing is sent anywhere, and no family data is stored in this repo.
Use **More → Family → Export backup** now and then, and save the file to Files / iCloud Drive.
Home-screen apps on iOS are exempt from Safari's 7-day storage cleanup, so always use the home-screen icon rather than a Safari tab.

## Development
No build step. Serve the folder and open it:

```bash
python3 -m http.server 5178
```

Releasing: bump `CACHE` in `sw.js` so installed copies pick up the new files.
