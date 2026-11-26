# JavaScript and TypeScript Rules

These rules apply to all JavaScript and TypeScript code in the frontend and backend. If rules conflict, follow the more context-specific rule as long as it does not reduce code safety or clarity.

## Prefer `const`

Use `const` by default. Use `let` only when a variable must be reassigned. Never use `var`, because it has function scope and can allow difficult-to-track reassignments.

Avoid:

```ts
var total = 0;
let name = 'Ana';
name = 'Bia';
```

Prefer:

```ts
const total = 0;
let name = 'Ana';
name = 'Bia';
```

Objects and arrays declared with `const` can still have their contents changed. To avoid accidental mutation, prefer creating new values with `map`, `filter`, and spread syntax:

```ts
type User = {
  id: string;
  name: string;
  active: boolean;
  isAdmin: boolean;
};

function activateUser(user: User): User {
  return { ...user, active: true };
}
```

## Explicit Comparisons

Always use `===` and `!==`. Never use `==` or `!=`, because implicit type conversion can produce unexpected results.

Avoid:

```ts
if (userId == 0 || status != 'active') {
  return false;
}
```

Prefer:

```ts
if (userId === 0 || status !== 'active') {
  return false;
}
```

For optional values, explicitly evaluate the condition you need. Use `??` when only `null` and `undefined` should be handled, and use `||` only when falsy values such as an empty string or zero are also invalid:

```ts
  const displayName = user.name ?? 'User without a name';
const pageSize = configuredPageSize || DEFAULT_PAGE_SIZE;
```

## Required Typing and Prohibition of `any`

Never use `any`. Prefer explicit types, `unknown` for genuinely unknown values, and type refinement before use.

Avoid:

```ts
function parseResponse(response: any): any {
  return response.data;
}
```

Prefer:

```ts
type ApiResponse<T> = {
  data: T;
};

function parseResponse<T>(response: ApiResponse<T>): T {
  return response.data;
}
```

When handling external input, validate `unknown` before accessing properties:

```ts
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getMessage(value: unknown): string | undefined {
  if (!isRecord(value) || typeof value.message !== 'string') {
    return undefined;
  }

  return value.message;
}
```

Type parameters and return values that involve objects. Prefer `type` or `interface` declarations with domain-specific names instead of repeating anonymous object shapes:

```ts
type CreateProductInput = {
  name: string;
  priceInCents: number;
};

type Product = CreateProductInput & {
  id: string;
};

function createProduct(input: CreateProductInput): Product {
  return { id: crypto.randomUUID(), ...input };
}
```

Typing primitive return values is also recommended when it makes the contract clearer. Always type asynchronous return values as `Promise<T>`:

```ts
async function loadProduct(id: string): Promise<Product> {
  return productRepository.findById(id);
}
```

## Arrow Functions

Prefer arrow functions in callbacks such as those used by `map`, `filter`, `reduce`, `sort`, and `Promise.then`:

```ts
const activeNames = users
  .filter((user: User) => user.active)
  .map((user: User) => user.name);
```

Do not replace named primary functions with arrow functions solely for stylistic preference. Keep primary functions in modules, services, and handlers declared with `function` when this improves their identification and stack traces:

```ts
function listActiveUsers(users: User[]): string[] {
  return users.filter((user: User) => user.active).map((user: User) => user.name);
}
```

Avoid nested callbacks. Extract logic into named functions or use `async/await`, following the Node.js rules.

## Simple Ternaries

Use a ternary only for a short, direct decision. Never nest ternaries, and do not use them as conditional assignment operators or to perform side effects.

Avoid:

```ts
const label = isAdmin ? (isActive ? 'Active administrator' : 'Inactive administrator') : 'User';
isReady ? startProcess() : stopProcess();
```

Prefer:

```ts
const label = isAdmin ? 'Administrator' : 'User';

if (isReady) {
  startProcess();
} else {
  stopProcess();
}
```

When there is more than one condition, use `if`, guard clauses, or extract a clearly named function:

```ts
function getAccessLabel(user: User): string {
  if (!user.active) {
    return 'Inactive';
  }

  return user.isAdmin ? 'Administrator' : 'User';
}
```

## Immutability and Collection Operations

Do not directly mutate parameters, state, or shared collections. Return new objects and arrays. Use `map` to transform, `filter` to select, `find` to locate an element, and `reduce` only when reduction clearly expresses the intent.

Avoid:

```ts
function addTag(tags: string[], tag: string): string[] {
  tags.push(tag);
  return tags;
}
```

Prefer:

```ts
function addTag(tags: string[], tag: string): string[] {
  return [...tags, tag];
}
```

Do not mutate objects received as arguments. When sorting is needed, copy the collection before calling `sort`:

```ts
function sortByName(users: User[]): User[] {
  return [...users].sort((first: User, second: User) => first.name.localeCompare(second.name));
}
```

## Error Handling

Throw `Error` instances with useful messages. Do not catch an error only to ignore it, and do not automatically convert every caught value into an `Error` without preserving context:

```ts
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

async function loadData(): Promise<Data> {
  try {
    return await dataRepository.load();
  } catch (error: unknown) {
    throw new Error(`Failed to load data: ${getErrorMessage(error)}`, { cause: error });
  }
}
```

Use `unknown` for the `catch` parameter when available. Handle the error in the layer with enough context to decide on a response or recovery.

## Imports, Modules, and Names

Use ES modules with `import` and `export`. Remove unused imports and avoid exporting symbols that are not part of the module contract.

Prefer complete, expressive names. Use `is`, `has`, and `can` for boolean functions, such as `isValidEmail`, `hasPermission`, and `canPublish`. Avoid abbreviations that are not universally understood.

Keep functions short and focused on a single responsibility. Extract numbers, strings, and regular expressions that represent business rules into constants. Also follow the size limits defined in `code-standards.md`.

## Required Validation

After completing any task that changes JavaScript or TypeScript code, run the linter for the affected application. In this repository, use:

```bash
cd frontend
npm run lint
```

The backend does not currently have a lint script. If a linter is configured for it, run the corresponding command after each change. Linting does not replace typechecking, builds, or tests; also run the validations required by the application and the nature of the change.
