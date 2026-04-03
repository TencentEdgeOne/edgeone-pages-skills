---
name: edgeone-pages-deploy
description: >-
  This skill deploys frontend and full-stack projects to EdgeOne Pages (Tencent EdgeOne).
  It should be used when the user's primary intent is to deploy, publish, ship, host, launch,
  go live, or release a new version — e.g. "deploy my app", "publish this site", "push this live",
  "create a preview deployment", "deploy to EdgeOne", "ship to production", "上线", "发布",
  "发一版", "重新部署".
  Do NOT trigger when deployment is only mentioned as a secondary step
  (e.g. "write an API and deploy it" — primary intent is writing code, use edgeone-pages-dev).
  Do NOT trigger for post-deployment runtime errors (e.g. CORS issues, 500 errors after deploy —
  use edgeone-pages-dev for troubleshooting).
metadata:
  author: edgeone
  version: "2.0.0"
---

# EdgeOne Pages Deployment Skill

Deploy any project to **EdgeOne Pages**.

## ⛔ Critical Rules (never skip)

1. **CLI version ≥ `1.2.30`** — reinstall if lower. Never proceed with an outdated version.
2. **Never truncate the deploy URL** — `EDGEONE_DEPLOY_URL` includes query parameters required for access. Always output the **complete** URL.
3. **Ask the user to choose China or Global site** before login. Never assume.
4. **Auto-detect the login method** — browser login in desktop environments, token login in headless/remote/CI environments. Follow the decision table below.
5. **After token login, ask if the user wants to save the token locally** for future use.

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
| Not installed or < 1.2.30 | — | → Go to **Install CLI** |
| `≥ 1.2.30` ✓ | Logged in | → Go to **Deploy** |
| `≥ 1.2.30` ✓ | Not logged in, has saved token | → Go to **Deploy with Token** (use saved token) |
| `≥ 1.2.30` ✓ | Not logged in, no saved token | → Go to **Login** |

---

## Install CLI

```bash
npm install -g edgeone@latest
```

Verify: `edgeone -v` — confirm output is `1.2.30` or higher. Retry installation if not.

---

## Login

### 1. Ask the user to choose a site

Use the IDE's selection control (`ask_followup_question`) before running any login command:

> Choose your EdgeOne Pages site:
> - **China** — For users in mainland China (console.cloud.tencent.com)
> - **Global** — For users outside China (console.intl.cloud.tencent.com)

### 2. Detect environment and choose login method

| Condition | Method |
|-----------|--------|
| Local desktop IDE (VS Code, Cursor, etc.) | **Browser Login** |
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

Token login does **NOT** use `edgeone login`. Pass the token directly in the deploy command via `-t`.

Guide the user to obtain a token:
1. Go to the console:
   - **China**: https://console.cloud.tencent.com/edgeone/pages?tab=settings
   - **Global**: https://console.intl.cloud.tencent.com/edgeone/pages?tab=settings
2. Find **API Token** → **Create Token** → Copy it

⚠️ Remind the user: the token has account-level permissions. Never commit it to a repository.

### 3. Offer to save the token locally

After the user provides a token, ask:

> Save this token locally for future deployments?
> - **Yes** — Save to `.edgeone/.token` (auto-used next time)
> - **No** — Use for this deployment only

**If Yes:**

```bash
mkdir -p .edgeone
echo "<token>" > .edgeone/.token
grep -q '.edgeone/.token' .gitignore 2>/dev/null || echo '.edgeone/.token' >> .gitignore
```

Confirm to the user: "✅ Token saved to `.edgeone/.token` and added to `.gitignore`."

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

First check for a saved token:

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

After a successful deploy with a manually-entered token, ask if the user wants to save it (see "Offer to save the token locally" above).

### Deploy to preview environment

```bash
edgeone pages deploy -e preview
```

### Build behavior

The CLI auto-detects the framework, runs the build, and uploads the output directory. No manual config needed.

---

## ⚠️ Parse Deploy Output (Critical)

After `edgeone pages deploy` succeeds, the CLI outputs:

```
[cli][✔] Deploy Success
EDGEONE_DEPLOY_URL=https://my-project-abc123.edgeone.cool?<auth_query_params>
EDGEONE_DEPLOY_TYPE=preset
EDGEONE_PROJECT_ID=pages-xxxxxxxx
[cli][✔] You can view your deployment in the EdgeOne Pages Console at:
https://console.cloud.tencent.com/edgeone/pages/project/pages-xxxxxxxx/deployment/xxxxxxx
```

**Extraction rules:**

| Field | How to extract | ⛔ Warning |
|-------|---------------|-----------|
| **Access URL** | Full value after `EDGEONE_DEPLOY_URL=` | **Include the full query string** (`?` and everything after) — without these params the page will not load |
| **Project ID** | Value after `EDGEONE_PROJECT_ID=` | — |
| **Console URL** | Line after "You can view your deployment..." | — |

**Show the user:**

> ✅ Deployment complete!
> - **Access URL**: `https://my-project-abc123.edgeone.cool?<auth_query_params>`
> - **Console URL**: `https://console.cloud.tencent.com/edgeone/pages/project/...`

---

## Error Handling

| Error | Solution |
|-------|----------|
| `command not found: edgeone` | Run `npm install -g edgeone@latest` |
| Browser does not open during login | Switch to token login |
| "not logged in" error | Run `edgeone whoami` to check, then re-login or use token |
| Auth error with token | Token may be expired — regenerate at the console |
| Project name conflict | Use a different name with `-n` |
| Build failure | Check logs — usually missing deps or bad build script |

---

For CLI command reference, environment variables, local dev setup, and token management details, see [references/command-reference.md](references/command-reference.md).
