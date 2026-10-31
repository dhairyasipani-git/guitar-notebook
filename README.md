# Guitar notebook

A class-by-class notebook for guitar lessons. Each class page holds just what you did in that class:

- **Topics**: techniques, theory, songs, anything. Type one and press Enter, or tap topics you've used before.
- **What I learnt**: a list of entries you add as you go:
  - **Tab**: written on a 6-string grid with a fret keypad, or pasted as text
  - **Note**: a heading and a paragraph, for theory or descriptions, which saves as you type
  - **Photo**: pictures of the sheets your teacher hands out (tap to view full screen and zoom)

The home page lists your classes, and you can filter them by topic. A small **Doubts** button in the corner keeps questions for your next class: tick one when it's cleared and it disappears (with a few seconds to undo).

Everything is stored in your browser on this device. Nothing is sent anywhere.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173. To try it on your phone while your laptop runs it, open the "Network" address Vite prints (same Wi-Fi). Home-screen install needs HTTPS, so for that you'll need to host it (below).

## Put it on your phone

The app is a static site, so any free static host works. Build it with:

```bash
npm run build
```

Upload the `dist` folder to a host such as Netlify Drop, Cloudflare Pages or GitHub Pages, then open the link on your phone:

- **iPhone**: Safari → Share → Add to Home Screen
- **Android**: Chrome → menu → Install app

Once installed it works offline.

## Your data

Notes live on the device you add them on, so your phone and laptop each have their own copy. Use **Backup → Export backup** now and then; the file holds all classes, photos, tabs, notes and doubts, and **Restore** loads it on another device (it replaces what's there).

On iPhone, Safari may clear data for websites you haven't opened in a while. Adding the app to your home screen avoids that, and so does keeping backups.

## Develop

```bash
npm test            # unit, data and UI flow tests
npm run coverage    # tests with a coverage report
npm run typecheck
npm run icons       # regenerate app icons from public/favicon.svg
```

Code layout:

- `src/lib` — pure logic (tab grid and text rendering, journey summary, tags, dates)
- `src/db` — IndexedDB storage via Dexie, zod validation, backup import and export
- `src/components`, `src/pages` — the React screens
