# EdgeOne Pages Skills

Official Agent Skills for developing and deploying projects on [EdgeOne Pages](https://edgeone.ai/products/pages).

## Installation

```bash
npx skills add edgeone-pages/edgeone-pages-skill
```

After installation, your AI coding agent will automatically detect when you want to develop or deploy and use the appropriate skill.

## Usage

Skills are automatically available once installed. The agent will use them when relevant tasks are detected.

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
Create an API endpoint for user registration
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

## Available Skills

### `edgeone-pages-deploy`

Deploy frontend or full-stack projects to EdgeOne Pages with a single command.

**Triggers**: "deploy my project", "deploy to EdgeOne Pages", "publish this site", "push this live"

**What it does**:
- Installs the EdgeOne CLI (`edgeone`) if not present
- Authenticates via browser login (preferred) or API token (headless/CI)
- Supports both China and Global sites
- Deploys with automatic framework detection and build
- Returns the live preview URL and console link

### `edgeone-pages-dev`

Guide development of full-stack features on EdgeOne Pages — Edge Functions, Node Functions, and Middleware.

**Triggers**: "create an API", "add a serverless function", "write middleware", "build a full-stack app", "add WebSocket support", "connect a database", "set up edge functions"

**What it does**:
- Helps choose the right runtime (Edge Functions vs Node Functions vs Middleware)
- Provides correct project structure and file-based routing patterns
- Guides Edge Functions development (V8 runtime, KV Storage, Web APIs)
- Guides Node Functions development (Node.js, npm, Express/Koa, WebSocket)
- Guides Middleware development (request interception, auth, redirects, A/B testing)
- Covers local dev setup, environment variables, and debugging

## Skill Structure

```
skills/
├── edgeone-pages-deploy/
│   └── SKILL.md          # Agent instructions for deployment
└── edgeone-pages-dev/
    └── SKILL.md          # Agent instructions for development
```

Each skill contains:
- `SKILL.md` — YAML frontmatter (name + description) followed by Markdown instructions for the agent

## Requirements

- **Node.js** ≥ 16
- **npm** (for CLI installation)
- An EdgeOne Pages account

  [China site](https://console.cloud.tencent.com/edgeone/pages) | [Global site](https://pages.edgeone.ai)

## License

MIT
