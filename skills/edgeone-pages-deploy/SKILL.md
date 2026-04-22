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
6. **Before triggering any browser popup (login / 注册), explain the reason and the benefits to the user first** — never silently launch a browser window.

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

### 0. Explain the registration/login step

Before triggering any login flow, explain to the user **why** this step is needed and **what** to expect. Do not silently launch a browser window.

Tell the user:

> 接下来需要登录 / 注册 EdgeOne Pages 账号，原因和收益如下：
> - **为什么要登录**：部署需要把构建产物上传到你自己的账号下，生成独立的访问 URL 和项目记录。
> - **免费能得到什么**：EdgeOne Pages 提供免费额度，包含全球 CDN 加速、自动 HTTPS、以及自定义域名绑定能力，个人项目通常完全够用。
> - **接下来会发生什么**：我会运行 `edgeone login`，你的默认浏览器会自动弹出腾讯云登录页面，请在浏览器中完成登录 / 注册并授权，然后回到这里。
> - **如果卡住了**：如果浏览器没弹出，或者你在浏览器里完成登录后 CLI 仍在等待，请告诉我，我会切换到 Token 登录方式。

如果用户长时间（例如超过 1–2 分钟）没有反馈登录完成，**主动询问**用户当前状态（浏览器是否打开、是否遇到报错、是否需要改用 Token 登录），不要无限期等待。

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

⚠️ **浏览器 Session 复用陷阱**：如果用户此前已经在同一个浏览器登录过 EdgeOne Pages 的**另一个站点**（例如之前登过国际站，这次要登国内站，或反之），浏览器可能**静默复用旧的腾讯云 session**，CLI 会以为登录成功，但实际绑定的是错误账号，后续 `deploy` 时会出现 auth 错误或 `whoami` 显示意外账号。

遇到这种情况，引导用户：
1. 在弹出的登录页点击「**使用其他账户登录**」切换账号；或
2. 先从**所有腾讯云控制台**（国内站 `console.cloud.tencent.com` 和国际站 `console.intl.cloud.tencent.com`）退出登录，再重新执行 `edgeone login`。

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
>
> ℹ️ 说明：此预览链接用于快速验证部署结果。在国内网络环境下访问时，因域名备案状态 / 加速策略等原因，链接可能在一段时间后或被分享给他人访问时出现访问限制（如 401）。如需长期稳定对外访问，建议绑定已备案的自定义域名。

---

## Error Handling

| Error | Solution |
|-------|----------|
| `command not found: edgeone` | Run `npm install -g edgeone@latest` |
| Browser does not open during login | Switch to token login |
| "not logged in" error | Run `edgeone whoami` to check, then re-login or use token |
| Auth error with token | Token may be expired — regenerate at the console |
| 登录显示成功，但 `deploy` 报 auth / 鉴权错误 | 浏览器复用了错误站点的旧 session，导致账号错位。点击登录页的「使用其他账户登录」重新登录，或先从所有腾讯云控制台退出后再试 |
| `edgeone whoami` 显示的是意外账号 | 同上：浏览器 session 复用导致。使用「使用其他账户登录」切换，或从所有腾讯云控制台退出后重登 |
| Project name conflict | Use a different name with `-n` |
| Build failure | Check logs — usually missing deps or bad build script |

---

For CLI command reference, environment variables, local dev setup, and token management details, see [references/command-reference.md](references/command-reference.md).
