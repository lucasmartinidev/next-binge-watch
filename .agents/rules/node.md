# Node.js Rules

These rules apply to this project's Node.js backend and any code executed on the server.

## Prefer async/await

Use `async/await` for asynchronous operations. Avoid nested callbacks because they make code harder to read, handle errors in, and compose.

Avoid:

```ts
fs.readFile(filePath, 'utf8', (error, content) => {
  if (error) {
    logger.error('Failed to read file', error);
    return;
  }

  processContent(content);
});
```

Prefer:

```ts
import { readFile } from 'node:fs/promises';

async function loadFile(filePath: string): Promise<string> {
  return readFile(filePath, 'utf8');
}

async function processFile(filePath: string): Promise<void> {
  try {
    const content = await loadFile(filePath);
    processContent(content);
  } catch (error) {
    logger.error('Failed to process file', error);
  }
}
```

Propagate errors with `throw` when the current layer does not have enough context to handle them. The layer responsible for the HTTP response should convert the error to an appropriate status and payload.

## Do Not Block the Event Loop

Do not run synchronous operations or heavy calculations in the request flow. Doing so prevents the process from handling other requests while the operation is running.

Avoid calls such as `readFileSync`, `writeFileSync`, and `execSync`, as well as long loops in HTTP handlers. Prefer asynchronous APIs for I/O:

```ts
import { readFile } from 'node:fs/promises';

const content = await readFile(filePath, 'utf8');
```

For CPU-intensive calculations such as encryption, compression, image processing, or large aggregations, use `worker_threads`, a separate process, or a work queue. The operation should leave the event loop free to continue handling requests.

Example using `worker_threads`:

```ts
import { Worker } from 'node:worker_threads';

export function runHeavyCalculation(input: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./heavy-calculation-worker.js', import.meta.url), {
      workerData: input,
    });

    worker.once('message', resolve);
    worker.once('error', reject);
    worker.once('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
    });
  });
}
```

Set size, time, and concurrency limits for heavy operations. When a task may take a long time, prefer processing it asynchronously and returning an identifier for tracking.

## Environment Variables with dotenv

Put environment-specific configuration in `.env` files and load it with `dotenv`. Do not hard-code ports, credentials, tokens, or environment-specific URLs.

```ts
import 'dotenv/config';

const port = Number(process.env.PORT ?? 3000);
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured');
}
```

Do not commit `.env` files that contain secrets. Maintain an `.env.example` with the required keys and placeholder values:

```dotenv
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/app
```

Validate required variables during startup, before opening the HTTP server. This makes the process fail fast when configuration is invalid.

## Graceful Shutdown

Every HTTP server must handle `SIGTERM` and `SIGINT`. During shutdown, stop accepting new connections, wait for in-flight requests within a deadline, and close resources such as databases, queues, and consumers.

```ts
const server = app.listen(port, () => {
  logger.info(`Server started on port ${port}`);
});

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`Received ${signal}; starting shutdown`);

  const forceExit = setTimeout(() => {
    logger.error('Shutdown deadline exceeded');
    process.exit(1);
  }, 10_000);

  server.close(async (error) => {
    if (error) {
      logger.error('Failed to close HTTP server', error);
      process.exitCode = 1;
    }

    await closeDatabase();
    clearTimeout(forceExit);
    process.exit();
  });
}

process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));
```

Shutdown must be idempotent: repeated signals must not start multiple shutdown routines. In production, the deadline must be appropriate for the runtime environment.

## Centralized Logging

Use `console.log` and `console.error` only inside a centralized adapter. The rest of the application should depend on this adapter so that log formatting and context are consistent and observability tooling can be integrated later.

```ts
type LogContext = Record<string, unknown>;

function formatMessage(message: string, context?: LogContext): string {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    message,
    ...context,
  });
}

export const logger = {
  info(message: string, context?: LogContext): void {
    console.log(formatMessage(message, context));
  },
  error(message: string, error?: unknown, context?: LogContext): void {
    const details = error instanceof Error ? { error: error.message, stack: error.stack } : { error };
    console.error(formatMessage(message, { ...details, ...context }));
  },
};
```

Do not log passwords, tokens, private keys, or unnecessary personal data. Include useful context such as request ID, route, and duration without exposing sensitive information.

## Lock Files

Use `npm` to install and manage libraries in this project. Run `npm install <package>` to add a production dependency and `npm install --save-dev <package>` to add a development dependency:

```bash
npm install dotenv
npm install --save-dev vitest
```

Do not mix package managers within the same application. Avoid running `yarn add` or `pnpm add` in applications that use npm, as this can create competing lock files and inconsistent installations.

Commit the lock file for each application (`package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml`). Because the frontend and backend are independent applications, each directory must maintain its own lock file.

Use the `package-lock.json` generated by npm. In CI, prefer reproducible installs with `npm ci` and update the lock file whenever dependencies change.

Do not ignore or remove lock files to resolve installation conflicts. Review generated changes and confirm that `package.json` and the lock file remain consistent.

## Avoid Circular Dependencies

Organize modules so dependencies point in a predictable direction. For example, routes may depend on services, and services may depend on data modules; data modules must not import routes.

Recommended flow:

```text
configuration → routes → services → data
                      ↓
                    types
```

Avoid situations where `routes/users.ts` imports `services/users.ts` while `services/users.ts` also imports `routes/users.ts`.

Extract shared contracts into `types/`, move common functions into independent modules, or introduce a composition layer during initialization. Each module must have a clear responsibility and must not depend on the module that instantiates it.

Before completing a change, verify that new imports do not create indirect cycles. Circular dependencies can produce partially initialized objects, import-order-dependent behavior, and difficult-to-diagnose errors.
