# FocusFlow
> ADHD Focus Studio — ambient sounds, daily planner, focus timer, mood tracker, and more.

---

## Table of Contents
- [Local Development](#local-development)
- [Project Structure](#project-structure)
- [Git Setup](#git-setup)
- [Deploying to Vercel](#deploying-to-vercel-your-site)
- [Deploying to IONOS](#deploying-to-ionos-her-site)
- [Daily Workflow](#daily-workflow)
- [Adding Hosted Audio](#adding-hosted-audio)

---

## Local Development

No build step. No npm install. Open in VS Code and use the
[Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
— right-click `index.html` → **Open with Live Server**.

Browser auto-refreshes on every file save.

---

## Project Structure

```
focusflow/
├── index.html
├── .github/
│   └── workflows/
│       └── deploy.yml        ← auto-deploys to IONOS on git push
├── css/
│   └── main.css
├── js/
│   ├── state.js              ← localStorage persistence
│   ├── clock.js
│   ├── background.js         ← canvas animations
│   ├── drag.js               ← collision-preventing drag system
│   ├── panels.js
│   ├── modules-manager.js
│   ├── app.js                ← entry point
│   └── modules/
│       ├── planner.js
│       ├── timer.js
│       ├── quote.js
│       ├── mood.js
│       ├── audio-module.js
│       ├── braindump.js
│       └── focusword.js
├── audio/                    ← drop hosted .mp3 files here
└── README.md
```

---

## Git Setup

### Initialize the repo (first time only)

```bash
cd focusflow
git init
git add .
git commit -m "initial commit"
```

### Connect to GitHub

```bash
git remote add origin https://github.com/YOURUSERNAME/focusflow.git
git branch -M main
git push -u origin main
```

---

## Deploying to Vercel (your site)

### First time setup

1. Push to GitHub (above)
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your `focusflow` GitHub repo
4. Leave all settings as default — Vercel detects it as a static site
5. Click **Deploy**

### Add your custom subdomain

1. Vercel dashboard → your project → **Settings** → **Domains**
2. Add `focus.yourdomain.com`
3. Vercel gives you a DNS record — add it wherever your domain DNS is managed
4. Takes 5–10 minutes to propagate

### After setup, every push auto-deploys

```bash
git push origin main
# Vercel detects the push and deploys in ~10 seconds
```

---

## Deploying to IONOS (her site)

IONOS only provides SFTP access (no SSH) on standard plans, so deployment
is handled by a GitHub Action that automatically uploads files via SFTP
every time you push to main. No manual file uploads needed.

### Step 1: Get your IONOS SFTP credentials

IONOS control panel → **Hosting** → your package → **FTP & SSH** or **FTP Accounts**

You need:
- **Host** — e.g. `home123456789.1and1-data.host`
- **Username** — your IONOS FTP username
- **Password** — your IONOS FTP password
- **Remote path** — the document root for the subdomain
  (e.g. `/var/www/focus.hersite.com/htdocs/`)

### Step 2: Create the subdomain on IONOS

IONOS control panel → **Domains & SSL** → **Subdomains** → Add `focus.hersite.com`

Note the document root folder it creates — you'll need it above.

### Step 3: Add credentials to GitHub Secrets

GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these four secrets:

| Secret Name | Value |
|-------------|-------|
| `SFTP_HOST` | your IONOS host |
| `SFTP_USER` | your IONOS FTP username |
| `SFTP_PASS` | your IONOS FTP password |
| `SFTP_PATH` | remote path from Step 1 (must end with `/`) |

### Step 4: Push — it deploys automatically

The `.github/workflows/deploy.yml` file is already in the project.
Once your secrets are set, just push:

```bash
git push origin main
```

GitHub Actions picks it up, uploads only the changed files via SFTP,
and the site is live at `focus.hersite.com` within about 30 seconds.

### Check deployment status

GitHub repo → **Actions** tab → you'll see each deploy run with a green
checkmark (success) or red X (something to fix). Click any run to see logs.

---

## Daily Workflow

### Push to your Vercel site only
```bash
git push origin main
# Vercel auto-deploys. IONOS action also runs — but only uploads if files changed.
```

Both deployments trigger from the same push since both watch `main`.
Vercel handles itself; the GitHub Action handles IONOS.

### Making a change

```bash
# edit a file in VS Code
git add .
git commit -m "describe what you changed"
git push origin main
# both sites update automatically
```

---

## Adding Hosted Audio

Drop your audio files into the `/audio` folder:

```
audio/
├── rain.mp3
├── thunder.mp3
├── fire.mp3
├── forest.mp3
├── waves.mp3
├── lofi.mp3
├── witchy.mp3
└── brown.mp3
```

In `js/modules/audio-module.js`, replace any generated builder with
the streaming version (prevents large files from loading into RAM):

```js
function buildRain() {
  const audio = new Audio('/audio/rain.mp3');
  audio.loop = true;

  const ctx = getCtx();
  const source = ctx.createMediaElementSource(audio);
  const out = ctx.createGain();
  source.connect(out);
  audio.play();

  return {
    out,
    nodes: [],
    stop() { audio.pause(); audio.currentTime = 0; }
  };
}
```

Trim silence from start and end of files in Audacity for seamless looping.

**File size reference:**
| Duration | 128kbps MP3 |
|----------|-------------|
| 30 min   | ~58 MB      |
| 1 hour   | ~115 MB     |
| 2 hours  | ~230 MB     |

---

## Notes

- Module positions and settings save to `localStorage` automatically.
- No backend, no database, no accounts — fully client-side.
- When ready to add user accounts or sell access,
  [Clerk](https://clerk.com) is the easiest auth layer to bolt on.
