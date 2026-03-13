# EdgeOne Pages Skills

Official Agent Skills for deploying projects to [EdgeOne Pages](https://edgeone.ai/products/pages).

## Installation

```bash
npx skills add TencentEdgeOne/edgeone-pages-skill
```

After installation, your AI coding agent will automatically detect when you want to deploy and use the appropriate skill.

## Usage

Skills are automatically available once installed. The agent will use them when relevant tasks are detected.

**Examples:**

```
Deploy my project to EdgeOne Pages
```

```
Publish this React app to EdgeOne Pages China site
```

```
Deploy this Next.js project and give me the preview URL
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

## Skill Structure

```
skills/
└── edgeone-pages-deploy/
    └── SKILL.md          # Agent instructions for deployment
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
