# Folder Structure

This document defines the expected organization for the frontend, backend, and project tests. Code directories belong under `src/` unless stated otherwise.

## Overview

```text
.
├── frontend/
├── backend/
└── e2e/
```

The frontend and backend are independent applications with their own configuration files, dependencies, and scripts. The `e2e/` directory is at the project root and contains end-to-end tests.

## Backend

```text
backend/
├── src/
│   ├── routes/
│   ├── services/
│   ├── data/
│   ├── types/
│   └── index.ts
├── package.json
├── nodemon.json
└── tsconfig.json
```

- `routes/`: defines HTTP routes, receives requests, validates basic input, and builds responses. It must not contain business rules.
- `services/`: contains business rules and application behavior. Services should be independent of the HTTP protocol whenever possible.
- `data/`: contains data and integrations such as queries, repositories, persistence, and external API access.
- `types/`: contains backend types. Put each type in its own file named after the concept it represents.
- `index.ts`: initializes the server and registers application configuration and routes.
- `*.test.ts`: unit and integration tests should be near the code they test, under `src/`, where applicable.

### Expected Flow

```text
HTTP request → routes → services → data → HTTP response
```

`routes` may depend on `services`, and `services` may depend on `data`. The `data` layer must not depend on `routes`.

## Frontend

```text
frontend/
├── public/
├── src/
│   ├── components/
│   ├── views/
│   ├── services/
│   ├── hooks/
│   ├── assets/
│   ├── types/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

- `components/`: reusable UI components. Components specific to a screen may be organized in their own subdirectories.
- `views/`: application screens and pages that compose components and coordinate screen state.
- `services/`: backend access, including HTTP clients, endpoint calls, and API response transformations.
- `hooks/`: reusable React hooks and state or behavior shared between components and views.
- `assets/`: images, icons, fonts, and other resources imported by application code.
- `types/`: frontend types. Put each type in its own file named after the concept it represents.
- `public/`: static files served directly without bundler processing.
- `*.test.ts` and `*.test.tsx`: unit and component tests should be near the code they test, under `src/`, where applicable.

### Expected Flow

```text
view → components/hooks → services → backend
```

Components and views must not duplicate backend access logic; encapsulate that access in `services/`.

## E2E Tests

```text
e2e/
└── *.spec.ts
```

E2E tests use Playwright to validate complete flows from the user's perspective. They must live outside `frontend/` and `backend/`. Unit and integration tests remain alongside application code in `frontend/src/` or `backend/src/`.

## Conventions

- Create a directory only when it represents a clear, recurring responsibility.
- Avoid putting business rules in `routes`, `components`, or `views`.
- Avoid accessing the backend directly from `components` or `views`; use `services/`.
- Keep configuration files at the root of the application they belong to.
