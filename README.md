# Taveez — Physical Lucky Charm & Daily Ritual 🧿✨

> **Taveez (تعویذ)** is a tactile lucky charm that hangs from a brass rail at the top of your browser screen. It sways on real pendulum physics, reacts to drag/flick gestures, performs procedural ritual chimes, remembers your state across visits and tabs, and runs both as a zero-cost PWA web app and a Chrome extension overlays on every website you visit.

---

## 🌟 Key Features

1. **Real Pendulum Physics Engine**
   - Pure differential equation simulation ($\alpha = -\frac{g}{L} \sin(\theta) - d \cdot \omega + F_{\text{wind}}$).
   - Pointer drag to swing, release to flick with velocity sampling.
   - Reduced-motion & battery awareness (auto-pauses loop when tab is hidden).
2. **Multi-Charm Garland Mode**
   - Hang up to 3 charms side-by-side on the brass rail.
   - Real-time 1D elastic angular collision nudges between charm bobs.
3. **Procedural Web Audio Sound Engine**
   - Zero audio files or external mp3 dependencies.
   - Synthesizes metallic brass bells, glass chimes, singing bowls, gongs, and wood taps using Web Audio API oscillators and gain envelopes.
4. **Charm Sanctuary & Custom Talismans**
   - 10 curated tradition charms (Nazar 🧿, Hamsa 🪬, Omamori ⛩️, Maneki-Neko 🐈‍⬛, Dreamcatcher 🕸️, Horseshoe 🧲, Clover 🍀, Temple Bell 🔔, Feng Shui Coin 🪙, Garland 🌼).
   - Custom emoji input allowing you to hang any talisman emoji.
5. **Cross-Tab Synchronization & Zero Backend Persistence**
   - Native `BroadcastChannel` real-time sync across open tabs with window `storage` event fallback for Safari.
   - Isolated namespace keys (`taveez_` for web, `taveez_ext_` for extension) preventing storage collisions.
6. **Developer Integration & Bless-on-Cue**
   - `?bless=1` URL query parameter & `window.postMessage` API for triggering blessings from Git hooks, CI pipelines, or bookmarklets.
   - Shareable charm links (`?charm=🪬&note=Blessings`).
7. **PWA & Chrome Extension Support**
   - Progressive Web App with offline Service Worker cache versioning (`CACHE_VERSION = 'taveez-v1'`).
   - Manifest V3 Chrome Extension overlaying the charm on every website with minimal permissions (`content_scripts` only).

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v18+) & npm

### Setup Steps

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev
```

Open your browser at `http://localhost:3000`.

---

## 📦 Production Build

```bash
# Build static production bundle into dist/
npm run build
```

---

## 🌐 100% Free Deployment Instructions

### Deploy to Vercel (Free Tier)
1. Install Vercel CLI: `npm i -g vercel` or push to GitHub and import repository on [vercel.com](https://vercel.com).
2. Framework Preset: **Vite** or **Other**.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Click **Deploy**.

### Deploy to Netlify (Free Tier)
1. Install Netlify CLI: `npm i -g netlify-cli` or connect repo via [netlify.com](https://netlify.com).
2. Build Command: `npm run build`
3. Publish Directory: `dist`
4. Click **Deploy Site**.

### Deploy to GitHub Pages (Free Tier)
1. In `package.json`, ensure build script runs `vite build`.
2. Push your project code to a GitHub repository.
3. Go to **Repository Settings** -> **Pages**.
4. Select **GitHub Actions** or set source to `gh-pages` branch.
5. For GitHub Actions, use the official static Vite Pages workflow.

---

## 🧩 Installing Chrome Extension Overlay Mode

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle in top-right corner).
3. Click **Load unpacked**.
4. Select the `extension/` directory inside this repository.
5. Visit any website — your Taveez charm will hang from the top right of your viewport!

---

## ⌨️ Accessibility & Keyboard Controls

| Key | Action |
| --- | --- |
| `Tab` | Focus pendulum canvas rail |
| `←` / `→` (Left/Right Arrows) | Nudge active pendulum swing left or right |
| `Space` / `Enter` | Perform ritual blessing on targeted charm |
| `1`, `2`, `3` | Target specific charm slot in Garland mode |

---

## 📜 License

100% Free and Open Source. Zero backend, zero subscriptions, zero paid APIs.
