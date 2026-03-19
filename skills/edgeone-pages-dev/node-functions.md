# Node Functions

Node.js v20.x runtime with full npm ecosystem support. Ideal for complex backend logic, database access, Express/Koa frameworks, and WebSocket.

## Basic function

File: `node-functions/api/data.js`

```javascript
export function onRequestGet(context) {
  return Response.json({
    message: 'Hello from Node Functions!',
    region: context.server.region,
  });
}

export async function onRequestPost(context) {
  const body = await context.request.json();
  // Process body...
  return Response.json({ received: body }, { status: 201 });
}
```

## EventContext object

```javascript
export function onRequest(context) {
  const {
    uuid,       // Unique request ID
    request,    // Standard Request object
    params,     // Dynamic route params
    env,        // Environment variables
    clientIp,   // Client IP address
    server,     // { region: string, requestId: string }
    geo,        // Client geolocation info
  } = context;

  return new Response('OK');
}
```

## Using npm packages

```javascript
// node-functions/api/data.js
import mysql from 'mysql2/promise';

export async function onRequestGet(context) {
  const connection = await mysql.createConnection({
    host: context.env.DB_HOST,
    user: context.env.DB_USER,
    password: context.env.DB_PASSWORD,
    database: context.env.DB_NAME,
  });

  const [rows] = await connection.execute('SELECT * FROM users LIMIT 10');
  await connection.end();

  return Response.json({ users: rows });
}
```

⚠️ Install dependencies in project root `package.json` — the platform builds them automatically.

## Express integration

File: `node-functions/api/[[default]].js`

```javascript
import express from 'express';

const app = express();
app.use(express.json());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express!' });
});

app.post('/api/users', (req, res) => {
  res.status(201).json({ user: req.body });
});

app.get('/api/users/:id', (req, res) => {
  res.json({ userId: req.params.id });
});

// MUST export the app — do NOT call app.listen()
export default app;
```

**Key rules for Express/Koa:**
- Entry file MUST use `[[...]]` naming pattern (e.g. `[[default]].js`)
- MUST `export default app` — do NOT call `app.listen()`
- All routes should include the full path prefix matching the file location

## Koa integration

File: `node-functions/api/[[default]].js`

```javascript
import Koa from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';

const app = new Koa();
const router = new Router();

app.use(bodyParser());

router.get('/api/hello', (ctx) => {
  ctx.body = { message: 'Hello from Koa!' };
});

router.post('/api/data', (ctx) => {
  ctx.body = { received: ctx.request.body };
});

app.use(router.routes());
app.use(router.allowedMethods());

// MUST export — do NOT call app.listen()
export default app;
```

## WebSocket

File: `node-functions/api/ws.js`

```javascript
export function onRequestGet(context) {
  const { request } = context;

  // Check for WebSocket upgrade
  const upgradeHeader = request.headers.get('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 });
  }

  // Create WebSocket pair
  const { socket, response } = new WebSocketPair();

  socket.addEventListener('message', (event) => {
    // Echo back
    socket.send(`Echo: ${event.data}`);
  });

  socket.addEventListener('close', () => {
    console.log('WebSocket closed');
  });

  return response;
}
```

## Limits

| Resource | Limit |
|----------|-------|
| Code package size | 128 MB |
| Request body | 6 MB |
| Wall clock time | 120 seconds |
| Language | Node.js only |

⚠️ Do NOT store persistent files locally — use external storage (e.g. Tencent Cloud COS) for persistent data.
