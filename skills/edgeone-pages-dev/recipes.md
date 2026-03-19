# Common Recipes

Project structure templates for typical EdgeOne Pages applications.

## Full-stack app (static + API)

```
my-app/
├── index.html              # Frontend
├── style.css
├── script.js
├── node-functions/
│   └── api/
│       ├── users.js        # GET/POST /api/users
│       └── users/[id].js   # GET/PUT/DELETE /api/users/:id
└── package.json
```

Frontend calls API:
```javascript
const res = await fetch('/api/users');
const users = await res.json();
```

## Edge API + KV counter

⚠️ **Prerequisites**: You must enable KV Storage in the console and bind a namespace first. See [kv-storage.md](kv-storage.md)

```
my-app/
├── index.html
├── edge-functions/
│   └── api/
│       └── visit.js        # Edge function with KV
└── package.json
```

**edge-functions/api/visit.js:**
```javascript
export async function onRequest() {
  // ⚠️ my_kv is a global variable (name set when binding namespace in console)
  let count = await my_kv.get('visits') || '0';
  count = String(Number(count) + 1);
  await my_kv.put('visits', count);
  
  return new Response(JSON.stringify({ visits: count }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

**Setup steps:**
1. Log in to the EdgeOne Pages console
2. Go to "KV Storage" → click "Apply Now"
3. Create a namespace (e.g. `my-kv-store`)
4. Bind to project, set variable name to `my_kv`
5. Deploy or run `edgeone pages dev` to test

## Express full-stack

```
my-app/
├── index.html
├── node-functions/
│   └── api/
│       └── [[default]].js  # Express app handles all /api/*
└── package.json
```

## Middleware + API combo

```
my-app/
├── middleware.js            # Auth guard for /api/*
├── node-functions/
│   └── api/
│       ├── public.js       # No auth needed (matcher excludes it)
│       └── data.js         # Protected by middleware
└── package.json
```
