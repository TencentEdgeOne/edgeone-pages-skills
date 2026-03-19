# Debugging & Troubleshooting

| Issue | Solution |
|-------|----------|
| Function not found / 404 | Check file location matches expected route path |
| `require is not defined` in Edge Functions | Edge Functions use ES modules — use `import` instead |
| npm package fails in Edge Functions | Edge Functions don't support npm — move to Node Functions |
| Express `app.listen()` error | Remove `app.listen()` — export the app directly |
| KV returns `undefined` | Run `edgeone pages link` first to connect your project |
| `ReferenceError: my_kv is not defined` | KV not enabled or namespace not bound — enable KV in the console, create namespace, and bind to project |
| Accessing `context.env.KV` returns `undefined` | KV is a **global variable**, not on `context.env` — use `my_kv.get(...)` directly |
| KV `get()` returns a Promise, not the value | Missing `await` — always `await` KV operations |
| KV not working in Node Functions | KV is only available in Edge Functions — use an external database for Node Functions |
| Env vars not available | Run `edgeone pages env pull` and restart dev server |
| Hot reload not working | Check you're using `edgeone pages dev`, not a custom dev server |
| Edge Function exceeds CPU limit | Move heavy computation to Node Functions (120s limit vs 200ms) |
| WebSocket not connecting | Ensure you're using Node Functions, not Edge Functions |
| Middleware runs on static assets | Add `config.matcher` to limit middleware to specific paths |
