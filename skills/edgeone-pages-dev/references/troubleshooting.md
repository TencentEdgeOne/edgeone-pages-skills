# Debugging & Troubleshooting

## General Issues

| Issue | Solution |
|-------|----------|
| Function not found / 404 | Check file location matches expected route path under `cloud-functions/` |
| Env vars not available | Run `edgeone pages env pull` and restart dev server |
| Hot reload not working | Check you're using `edgeone pages dev`, not a custom dev server |
| Middleware runs on static assets | Add `config.matcher` to limit middleware to specific paths |

## Edge Functions

| Issue | Solution |
|-------|----------|
| `require is not defined` | Edge Functions use ES modules — use `import` instead |
| npm package fails | Edge Functions don't support npm — move to Cloud Functions (Node.js) |
| `Response.json()` not available | Use `new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })` |
| Exceeds CPU limit | Move heavy computation to Cloud Functions (120s limit vs 200ms) |

## KV Storage

| Issue | Solution |
|-------|----------|
| KV returns `undefined` | Run `edgeone pages link` first to connect your project |
| `ReferenceError: my_kv is not defined` | KV not enabled or namespace not bound — enable KV in the console, create namespace, and bind to project |
| Accessing `context.env.KV` returns `undefined` | KV is a **global variable**, not on `context.env` — use `my_kv.get(...)` directly |
| KV `get()` returns a Promise | Missing `await` — always `await` KV operations |
| KV not working in Cloud Functions | KV is only available in Edge Functions — use an external database for Cloud Functions |

## Cloud Functions — Node.js

| Issue | Solution |
|-------|----------|
| Express `app.listen()` error | Remove `app.listen()` — export the app directly with `export default app` |
| WebSocket not connecting | Ensure you're using Cloud Functions (Node.js), not Edge Functions |
| `res.send()` not working | Non-framework functions return Web `Response` objects, not Express-style `res` |
| Framework routes not matching | Check entry file uses `[[default]].js` pattern and routes don't include the file-system prefix |

## Cloud Functions — Go

| Issue | Solution |
|-------|----------|
| Build fails with Go errors | Ensure `go.mod` exists in project root with correct module path |
| Handler function not found | Handler mode requires `package handler` with an exported func matching `http.HandlerFunc` signature |
| Framework routes return 404 | Check entry file name — it determines the URL prefix (e.g. `api.go` → `/api` prefix) |
| Mixed mode error | Cannot mix Handler and Framework modes — choose one per project |
| Port binding error in Framework mode | Use `r.Run(":9000")` or similar — platform maps the port automatically |

## Cloud Functions — Python

| Issue | Solution |
|-------|----------|
| Python file not registered as route | File must contain entry pattern: `class handler(BaseHTTPRequestHandler)`, `app = Flask(...)`, `app = FastAPI(...)`, or `application = get_wsgi_application()` |
| Import errors / missing dependencies | Add to `cloud-functions/requirements.txt` or project root `requirements.txt` — auto-detect may miss some packages |
| Flask route returns 404 | Framework routes don't include file-system prefix — use `@app.route('/users')` not `@app.route('/api/users')` for `api/index.py` |
| FastAPI async issues | Ensure Python 3.10 compatible async patterns — `async def` handlers work natively |
| Django not working | Use `application = get_wsgi_application()` pattern in entry file |
| `__pycache__` or `venv` causing issues | These directories are auto-excluded from build — no action needed |
