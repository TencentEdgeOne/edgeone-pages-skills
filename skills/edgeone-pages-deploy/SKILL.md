---
name: edgeone-pages-deploy
description: Deploy frontend and full-stack projects to EdgeOne Pages (Tencent EdgeOne). Use when the user wants to deploy, publish, ship, host, launch, or go live on EdgeOne Pages — e.g. "deploy my app", "publish this site", "push this live", "deploy and give me the link", "create a preview deployment", "deploy to EdgeOne", or "ship to production".
metadata:
  author: edgeone
  version: "1.1.0"
---

# EdgeOne Pages Deployment Skill

Deploy any project to **EdgeOne Pages**.

## ⛔ Critical Rules (MUST follow — never skip)

1. **CLI version MUST be `1.2.9-beta.8`**. If any other version is installed, reinstall. Do NOT proceed with a wrong version.
2. **NEVER truncate the deploy URL**. The `EDGEONE_DEPLOY_URL` includes `eo_token=` and `eo_time=` query parameters — they are required for access. Always output the **complete** URL.
3. **MUST ask the user to choose China or Global site** before login. Never assume.
4. **MUST auto-detect the login method** — browser login in desktop environments, token login in headless/remote/CI environments. Follow the decision table below.
5. **After token login, MUST ask if the user wants to save the token locally** for future use.

---

## Deployment Flow

Run these checks first, then follow the decision table:

```bash
# Check 1: CLI installed and correct version?
edgeone -v

# Check 2: Already logged in?
edgeone whoami

# Check 3: Project already linked?
cat edgeone.json 2>/dev/null

# Check 4: Saved token exists?
cat .edgeone/.token 2>/dev/null
```

### Decision Table

| CLI version | Login status | Action |
|-------------|-------------|--------|
| Not installed or wrong version | — | → Go to **Install CLI** |
| `1.2.9-beta.8` ✓ | Logged in | → Go to **Deploy** |
| `1.2.9-beta.8` ✓ | Not logged in, has saved token | → Go to **Deploy with Token** (use saved token) |
| `1.2.9-beta.8` ✓ | Not logged in, no saved token | → Go to **Login** |

---

## Install CLI

```bash
npm install -g edgeone@1.2.9-beta.8
```

Verify: `edgeone -v` must output `1.2.9-beta.8`. If not, retry installation.

---

## Login

### 1. Ask the user to choose a site

**You MUST ask before running any login command.** Use the IDE's selection control (`ask_followup_question`):

> Choose your EdgeOne Pages site:
> - **China** — For users in mainland China (console.cloud.tencent.com)
> - **Global** — For users outside China (console.intl.cloud.tencent.com)

### 2. Detect environment and choose login method

| Condition | Method |
|-----------|--------|
| Local desktop IDE (e.g. VS Code, Cursor, etc.) | **Browser Login** |
| Remote / SSH / container / CI / cloud IDE / headless | **Token Login** |
| User explicitly requests token | **Token Login** |

#### Browser Login

```bash
# China site
edgeone login --site china

# Global site
edgeone login --site global
```

Wait for the user to complete browser auth. The CLI prints a success message when done.

#### Token Login

Token login does **NOT** use `edgeone login`. The token is passed directly in the deploy command via `-t`.

Guide the user to get a token:
1. Go to the console:
   - **China**: https://console.cloud.tencent.com/edgeone/pages?tab=settings
   - **Global**: https://console.intl.cloud.tencent.com/edgeone/pages?tab=settings
2. Find **API Token** → **Create Token** → Copy it

⚠️ Remind the user: the token has account-level permissions. Never commit it to a repository.

### 3. Offer to save the token locally

**After the user provides a token, MUST ask:**

> Would you like to save this token locally for future deployments?
> - **Yes** — Save to `.edgeone/.token` (auto-used next time)
> - **No** — Use for this deployment only

**If Yes:**

```bash
mkdir -p .edgeone
echo "<token>" > .edgeone/.token
grep -q '.edgeone/.token' .gitignore 2>/dev/null || echo '.edgeone/.token' >> .gitignore
```

Tell the user: "✅ Token saved to `.edgeone/.token` and added to `.gitignore`."

---

## Deploy

### Browser-authenticated deploy

```bash
# Project already linked (edgeone.json exists)
edgeone pages deploy

# New project (no edgeone.json)
edgeone pages deploy -n <project-name>
```

`<project-name>`: auto-generate from the project directory name. The first deploy creates `edgeone.json` automatically.

### Token-based deploy

**First check for a saved token:**

```bash
cat .edgeone/.token 2>/dev/null
```

- Saved token found → use it, tell the user: "Using saved token from `.edgeone/.token`"
- No saved token → ask the user to provide one (see Token Login above)

```bash
# Project already linked
edgeone pages deploy -t <token>

# New project
edgeone pages deploy -n <project-name> -t <token>
```

The token already contains site info — no `--site` flag needed.

**After a successful deploy with a manually-entered token**, ask if the user wants to save it (see "Offer to save the token locally" above).

### Deploy to preview environment

```bash
edgeone pages deploy -e preview
```

### Build behavior

The CLI auto-detects the framework, runs the build, and uploads the output directory. No manual config needed.

---

## ⚠️ Parse Deploy Output (Critical — read carefully)

After `edgeone pages deploy` succeeds, the CLI outputs:

```
[cli][✔] Deploy Success
EDGEONE_DEPLOY_URL=https://my-project-abc123.edgeone.cool?eo_token=xxxx&eo_time=yyyy
EDGEONE_DEPLOY_TYPE=preset
EDGEONE_PROJECT_ID=pages-xxxxxxxx
[cli][✔] You can view your deployment in the EdgeOne Pages Console at:
https://console.cloud.tencent.com/edgeone/pages/project/pages-xxxxxxxx/deployment/xxxxxxx
```

**Extraction rules:**

| Field | How to extract | ⛔ Warning |
|-------|---------------|-----------|
| **Access URL** | Full value after `EDGEONE_DEPLOY_URL=` | **MUST include `?eo_token=...&eo_time=...`** — without these params the page won't load |
| **Project ID** | Value after `EDGEONE_PROJECT_ID=` | — |
| **Console URL** | Line after "You can view your deployment..." | — |

**Show the user:**

> ✅ Deployment complete!
> - **Access URL**: `https://my-project-abc123.edgeone.cool?eo_token=xxxx&eo_time=yyyy`
> - **Console URL**: `https://console.cloud.tencent.com/edgeone/pages/project/...`

---

## Error Handling

| Error | Solution |
|-------|----------|
| `command not found: edgeone` | `npm install -g edgeone@1.2.9-beta.8` |
| Browser doesn't open during login | Use token login instead |
| "not logged in" error | `edgeone whoami` to check, then re-login or use token |
| Auth error with token | Token may be expired — regenerate at the console |
| Project name conflict | Use a different name with `-n` |
| Build failure | Check logs — usually missing deps or bad build script |

---

## Appendix

### Edge/Node Functions

For projects needing server-side functions, run before first deploy:

```bash
edgeone pages init
```

Pure static projects skip this.

### Local Development

```bash
edgeone pages dev    # http://localhost:8088/
```

### Environment Variables

```bash
edgeone pages env ls          # List all
edgeone pages env pull        # Pull to local .env
edgeone pages env add KEY val # Add
edgeone pages env rm KEY      # Remove
```

### Project Linking

```bash
edgeone pages link
```

### Token Management

| Task | How |
|------|-----|
| Save token | Stored in `.edgeone/.token` (auto-added to `.gitignore`) |
| Update token | Delete `.edgeone/.token`, then deploy again — you'll be prompted to enter and save a new one |
| Use saved token | Automatic — the agent reads `.edgeone/.token` before each token deploy |

### Command Reference

| Action | Command |
|--------|---------|
| Install CLI | `npm install -g edgeone@1.2.9-beta.8` |
| Check version | `edgeone -v` |
| Login (China) | `edgeone login --site china` |
| Login (Global) | `edgeone login --site global` |
| View login info | `edgeone whoami` |
| Logout | `edgeone logout` |
| Switch account | `edgeone switch` |
| Init functions | `edgeone pages init` |
| Local dev | `edgeone pages dev` |
| Link project | `edgeone pages link` |
| Deploy | `edgeone pages deploy` |
| Deploy new project | `edgeone pages deploy -n <name>` |
| Deploy preview | `edgeone pages deploy -e preview` |
| Deploy with token | `edgeone pages deploy -t <token>` |
