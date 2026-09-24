# NextRep on a phone: install and update checklist

Last verified 2026-09-24 against a production build (`npm run build` then `npm run start`)
in desktop Chrome. Nothing here was tested on a physical iPhone or Android phone, so the
"On a real phone" section is a checklist for a human to run once.

## What was verified automatically (real Chrome, production build)

| Check | Result |
| --- | --- |
| Manifest parses with no errors | Pass |
| `name` / `short_name` | `NextRep` / `NextRep` |
| `start_url`, `scope`, `id` | `/`, `/`, `/` |
| `display` | `standalone` |
| `theme_color` / `background_color` | `#070503` for both (matches the app's `--bg` and the `<meta name="theme-color">`) |
| Icons | 192 and 512 (`any`) plus 512 (`maskable`), all load at their declared size |
| Maskable safe zone | The ball's farthest point is 28.5% of the width from center, inside the 40% safe circle, so no clipping on round or squircle masks |
| Apple touch icon | `/icons/apple-touch-icon.png`, 180x180 |
| iOS web app tags | `apple-mobile-web-app-capable`, `apple-mobile-web-app-title`, `apple-mobile-web-app-status-bar-style` present |
| Chrome installability errors | None (the only one reported was `in-incognito`, which is the test browser profile, not the app) |
| Service worker | Registers at scope `/`, activates, and controls the page on first load (`skipWaiting` + `clients.claim`) |
| Offline | With the server stopped, `/login`, `/dashboard`, `/demo` and an unknown route all show the branded "You are offline" page; cached icons still load |
| Update from the old app | A phone holding the `v1` cache: after the new worker installs, the `v1` cache is deleted, the `v2` cache holds the current offline page, and open pages are claimed. No stale shell is left behind |
| Install banner | Hidden when the app runs in standalone mode (`display-mode: standalone` or iOS `navigator.standalone`), and never overlaps the bottom tab bar (it is positioned above `--nav-h` plus the home-indicator inset) |

### Standalone mode: no dead ends

An installed app has no browser back button, so every screen needs its own way out:

- Signed-in screens: the sidebar (desktop) or bottom tab bar (phone) is always present.
- `/demo`: sticky banner with a back link to the home page.
- `/login`, `/auth/reset-password`: "Back to NextRep" link on login; reset page redirects to the dashboard on success.
- `/`, `/pilot`, `/privacy`, `/terms`: header with the NextRep logo link and section links.
- `/offline`: "Try again" button.
- 404 and error screens: "Back to home" links (the global error screen uses a plain link on purpose).
- External links: the exercise "Watch form video" link opens in a new tab and now says so for screen readers. `mailto:` links hand off to the mail app.

## The service worker and updates

`public/sw.js` only caches things that are identical for every visitor (hashed build files,
brand icons, the `/offline` page). It never caches signed-in pages or API responses.

- **When you must bump `CACHE_VERSION`:** whenever the `/offline` page, anything in
  `public/icons`, or the brand colors change. A browser only installs a new worker when
  `sw.js` itself changes, and icons are served cache-first, so without a bump people keep the
  old ones. It is now `v2` (offline page rebuilt on the new design system).
- **What happens on the phone:** the next time the app is opened online, the browser sees the
  new `sw.js`, installs it, the worker takes over immediately, deletes the `v1` cache, and
  keeps the new offline page. No action is needed from the user for code changes.
- The static cache is capped at 150 entries (oldest build files are dropped first) so it cannot
  grow forever across deploys.

## How to update or reinstall on a phone

Code and design changes arrive on their own: close the app completely and open it again while
online. Do the reinstall steps below only when the **icon, app name, or theme color** changed,
because phones copy the home screen icon and name at install time and do not refresh them.
This release changes the theme color slightly and adds a rebuilt offline page; the icon and
name are unchanged, so a reinstall is optional for this release.

### iPhone or iPad (Safari)

1. Press and hold the NextRep icon on the home screen, tap **Remove App**, then **Delete App**.
   (Deleting only removes the shortcut and its local storage; your account and data stay on the server.)
2. Open Safari and go to the NextRep site.
3. Tap the **Share** button, choose **Add to Home Screen**, then **Add**.
4. Open it from the new icon and sign in again if asked.

Only Safari can add web apps on older iOS versions. On iOS 16.4 and newer, other browsers
also offer **Add to Home Screen** in their share menu.

### Android (Chrome)

1. Press and hold the NextRep icon, then choose **Uninstall** (or **Remove**).
2. Open Chrome and go to the NextRep site.
3. Tap the **three dots menu**, then **Install app** (sometimes labeled **Add to Home screen**), and confirm.
4. Or wait for the in-app "Add NextRep to your home screen" banner and tap **Install**.

### If the app looks out of date without a reinstall

- Close it fully (swipe it away from the app switcher), wait a few seconds, reopen it while online.
- Still stale on Android: Chrome **Settings, Site settings, All sites, NextRep, Clear & reset**.
- Still stale on iPhone: **Settings, Safari, Advanced, Website Data**, search for the NextRep
  site, delete it, then reinstall as above.

## On a real phone (not tested here, please run once)

- [ ] Install on an iPhone and confirm the icon looks right and the app opens full screen with no Safari bars.
- [ ] Install on an Android phone and confirm the icon is not clipped by the launcher's mask and the splash screen background is dark, not white.
- [ ] Open the installed app, turn on airplane mode, close and reopen it: you should see the "You are offline" page, and "Try again" should work once you are back online.
- [ ] Rotate to landscape on a notched iPhone: content and the bottom tab bar should stay clear of the notch and home indicator.
- [ ] Focus a text field (workout weight, notes): the bottom bars step aside and the field stays visible above the keyboard.
- [ ] After the next deploy that changes `sw.js`, reopen an installed copy once and confirm it still loads and shows the new version.
