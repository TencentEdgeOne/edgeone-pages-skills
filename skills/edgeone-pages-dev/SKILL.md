---
name: edgeone-pages-dev
description: Guide development on EdgeOne Pages — Edge Functions, Node Functions, Middleware, and local dev workflows. Use when the user wants to create APIs, serverless functions, middleware, WebSocket endpoints, or full-stack features on EdgeOne Pages — e.g. "create an API", "add a serverless function", "write middleware", "build a full-stack app", "add WebSocket support", or "set up edge functions".
metadata:
  author: edgeone
  version: "2.0.0"
---

# EdgeOne Pages Development Guide

Develop full-stack applications on **EdgeOne Pages** — Edge Functions, Node Functions, and Middleware.

## When to use this skill

- Creating APIs, serverless functions, or backend logic on EdgeOne Pages
- Adding middleware for request interception, redirects, auth guards, or A/B testing
- Building full-stack apps with static frontend + server-side functions
- Using KV Storage for edge-side persistent data
- Setting up WebSocket endpoints
- Integrating Express or Koa frameworks on EdgeOne Pages

**Do NOT use for:**
- Deployment → use `edgeone-pages-deploy` skill
- Next.js / Nuxt middleware → use the framework's own middleware API, NOT the platform `middleware.js`

## How to use this skill (for a coding agent)

1. Read the **Decision Tree** below to pick the correct runtime
2. Follow the **Routing** table to read the relevant module file
3. Use the code patterns from that module to implement the user's request

## ⛔ Critical Rules (MUST follow)

1. **Choose the right runtime for the task.** Follow the Decision Tree below — never guess.
2. **Edge Functions run on V8, NOT Node.js.** Do NOT use Node.js built-in modules (`fs`, `path`, `crypto` from Node) or npm packages in Edge Functions.
3. **Node Functions MUST return a standard Web `Response` object**, not `res.send()` — unless using Express/Koa via the `[[default]].js` pattern.
4. **Middleware is for lightweight request interception ONLY.** Never put heavy computation or database calls in middleware.
5. **Always use `edgeone pages dev` for local development.** Do NOT run a separate dev server for functions — the CLI handles everything on port 8088.
6. **Never configure `edgeone pages dev` as the `devCommand` in `edgeone.json` or as the `dev` script in `package.json`** — this causes infinite recursion.
7. **For framework projects (Next.js, Nuxt, etc.), use the framework's own middleware — NOT the platform `middleware.js`.** For example, in Next.js projects use `middleware.ts` at the project root with Next.js middleware API (`NextRequest`, `NextResponse`), NOT the EdgeOne Pages `middleware.js` format. The platform middleware file is only for non-framework or pure static projects.

---

## Technology Decision Tree

Use this to pick the correct approach for each user request:

```
User needs request interception / redirect / rewrite / auth guard / A/B test?
  → Middleware                                → read middleware.md

User needs a lightweight API with ultra-low latency (simple logic, no npm)?
  → Edge Functions                            → read edge-functions.md

User needs KV persistent storage? (⚠️ must enable KV in console first)
  → Edge Functions + KV Storage               → read kv-storage.md

User needs complex backend logic / npm packages / database / WebSocket?
  → Node Functions                            → read node-functions.md

User needs Express or Koa framework?
  → Node Functions with [[default]].js entry  → read node-functions.md

User has a pure static site with no server-side logic?
  → No functions needed — just deploy static files

Need a project structure template?
  → read recipes.md
```

### Runtime Comparison

| Feature | Edge Functions | Node Functions | Middleware |
|---------|--------------|----------------|------------|
| **Runtime** | V8 (like Cloudflare Workers) | Node.js v20.x | V8 (edge) |
| **npm packages** | ❌ Not supported | ✅ Full npm ecosystem | ❌ Not supported |
| **Max code size** | 5 MB | 128 MB | Part of edge bundle |
| **Max request body** | 1 MB | 6 MB | N/A (passes through) |
| **Max CPU / wall time** | 200 ms CPU | 120 s wall clock | Lightweight only |
| **KV Storage** | ✅ Yes (global variable) | ❌ No | ❌ No |
| **WebSocket** | ❌ No | ✅ Yes | ❌ No |
| **Use case** | Lightweight APIs, edge compute | Complex APIs, full-stack | Request preprocessing |

---

## Routing

| Task | Read |
|------|------|
| Edge Functions (lightweight APIs, V8 runtime, KV Storage) | [edge-functions.md](edge-functions.md) |
| KV Storage (persistent key-value storage on edge) | [kv-storage.md](kv-storage.md) |
| Node Functions (npm, database, Express/Koa, WebSocket) | [node-functions.md](node-functions.md) |
| Middleware (redirects, rewrites, auth guards, A/B testing) | [middleware.md](middleware.md) |
| Project structure templates and common recipes | [recipes.md](recipes.md) |
| Debugging and troubleshooting | [troubleshooting.md](troubleshooting.md) |

---

## Project Setup

### 1. Initialize the project

```bash
edgeone pages init
```

The CLI will guide you to create `edge-functions/` and/or `node-functions/` directories with sample functions.

### 2. Standard project structure

```
my-project/
├── edge-functions/          # Edge Functions (V8 runtime)
│   └── api/
│       ├── hello.js         # → /api/hello
│       ├── users/
│       │   ├── list.js      # → /api/users/list
│       │   ├── [id].js      # → /api/users/:id (dynamic)
│       │   └── index.js     # → /api/users
│       └── [[default]].js   # → /api/* (catch-all)
├── node-functions/          # Node Functions (Node.js runtime)
│   └── api/
│       ├── data.js          # → /api/data
│       ├── ws.js            # → /api/ws (WebSocket)
│       └── [[default]].js   # → /api/* (Express/Koa entry)
├── middleware.js             # Middleware (runs before all requests)
├── edgeone.json              # Project config (auto-generated)
├── package.json
├── index.html                # Static frontend
└── ...
```

### 3. Local development

```bash
edgeone pages dev
```

- Serves everything on `http://localhost:8088/` — frontend and functions unified, no proxy needed.
- Hot reload is supported; avoid restarting the CLI frequently (Edge Functions has startup count limits).
- Use `console.log()` in functions for debugging — logs appear in the terminal.

### 4. Link project (for KV & env vars)

```bash
edgeone pages link
```

Required if you need KV Storage access or want to sync environment variables from the console.

### 5. Environment variables

```bash
edgeone pages env ls            # List all
edgeone pages env pull          # Pull to local .env
edgeone pages env pull -f .env.prod  # Pull to specific file
edgeone pages env add KEY value # Add
edgeone pages env rm KEY        # Remove
```

Access in functions via `context.env.KEY`.
