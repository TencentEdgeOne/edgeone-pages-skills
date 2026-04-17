# EdgeOne Pages Skills

Official Agent Skills for developing and deploying projects on [EdgeOne Pages](https://edgeone.ai/products/pages).

## Installation

```bash
npx skills add TencentEdgeOne/edgeone-pages-skills
```

After installation, your AI coding agent will automatically detect when you want to develop or deploy and use the right skill.

## Usage

The skills are automatically available once installed. The agent will use them when relevant tasks are detected.

**Deployment examples:**

```
Deploy my project to EdgeOne Pages
```

```
Publish this React app to EdgeOne Pages China site
```

```
Deploy this Next.js project and give me the preview URL
```

**Development examples:**

```
Create an API for user registration
```

```
Add WebSocket support to my project
```

```
Write middleware to protect my /api routes with auth
```

```
Set up Edge Functions with KV storage for a page view counter
```

```
Create a Go API with Gin framework
```

```
Build a Python backend with FastAPI
```

## Skills

### Skill 1: `edgeone-pages-deploy`

Deploys frontend and full-stack projects to EdgeOne Pages.

**Triggers**: "deploy my app", "publish this site", "push this live", "create a preview deployment", "deploy to EdgeOne", "ship to production", "上线", "发布", "发一版", "重新部署"

**What it does**:
- Installs the EdgeOne CLI (`edgeone`) if not present
- Authenticates via browser login (preferred) or API token (headless/CI)
- Supports both China and Global sites
- Deploys with automatic framework detection and build
- Returns the live preview URL and console link

### Skill 2: `edgeone-pages-dev`

Guides development of full-stack features on EdgeOne Pages.

**Triggers**: "create an API", "add a serverless function", "write middleware", "build a full-stack app", "add WebSocket support", "set up edge functions", "use KV storage", "create a Go API", "build a Python backend", "use Flask/FastAPI/Gin on EdgeOne Pages"

**What it does**:
- Helps choose the right runtime (Edge Functions vs Cloud Functions vs Middleware)
- Provides correct project structure and file-based routing patterns
- Guides Edge Functions development (KV Storage, Web APIs)
- Guides Cloud Functions development:
  - **Node.js** — npm, database, Express/Koa, WebSocket
  - **Go** — Gin, Echo, Chi, Fiber, standard net/http
  - **Python** — Flask, FastAPI, Django, Sanic, Handler class
- Guides Middleware development (request interception, auth, redirects, A/B testing)
- Covers local dev setup, environment variables, and debugging

## Skill Structure

```
skills/
├── edgeone-pages-deploy/
│   ├── SKILL.md                        # Deployment flow, CLI setup, login, token management
│   └── references/
│       └── command-reference.md        # CLI commands, env vars, token management
└── edgeone-pages-dev/
    ├── SKILL.md                        # Entry point — decision trees & routing table
    └── references/
        ├── edge-functions.md           # Edge Functions (V8 runtime, Web APIs)
        ├── kv-storage.md              # KV Storage setup & API reference
        ├── node-functions.md          # Cloud Functions — Node.js (npm, Express/Koa, WebSocket)
        ├── go-functions.md            # Cloud Functions — Go (Gin, Echo, Chi, Fiber, net/http)
        ├── python-functions.md        # Cloud Functions — Python (Flask, FastAPI, Django, Sanic)
        ├── middleware.md              # Middleware (auth, redirects, A/B testing)
        ├── recipes.md                 # Project structure templates & common recipes
        └── troubleshooting.md         # Debugging & troubleshooting guide
```

Each skill follows the [skill-creator](https://github.com/anthropics/skills) standard:
- `SKILL.md` — YAML frontmatter (name + description) + core instructions
- `references/` — detailed reference docs loaded on demand, routed from `SKILL.md`

## Trigger Evaluation

Automated test suite to verify skill trigger accuracy. Uses Claude API as a "skill router" to batch-test queries and compute Precision / Recall / F1.

```bash
# Run full evaluation
ANTHROPIC_API_KEY=sk-xxx node eval/run-eval.mjs

# Verbose mode — print model's reasoning for each query
ANTHROPIC_API_KEY=sk-xxx node eval/run-eval.mjs --verbose

# Use a different model
ANTHROPIC_API_KEY=sk-xxx node eval/run-eval.mjs --model=claude-opus-4-20250514
```

Pass criteria: **Precision ≥ 0.90, Recall ≥ 0.80, F1 ≥ 0.85**. Results are saved to `eval/results.json`.

See [`eval/trigger-tests.md`](eval/trigger-tests.md) for the full test case design and boundary analysis.

## Requirements

- **Node.js** ≥ 16
- **npm** (for CLI installation)
- An EdgeOne Pages account

  [China site](https://console.cloud.tencent.com/edgeone/pages) | [Global site](https://pages.edgeone.ai)

## License

MIT
