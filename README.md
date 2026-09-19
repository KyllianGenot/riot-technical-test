# Riot take-home API

Bootstrap of an HTTP API built with Node.js, TypeScript and Express. The API endpoints are added in subsequent commits.

## Requirements

- Node.js >= 22.13

## Setup

```sh
npm install
cp .env.example .env
```

## Commands

| Command                | Purpose                                   |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Start the API with reload on file changes |
| `npm run build`        | Compile TypeScript to `dist/`             |
| `npm start`            | Run the compiled API                      |
| `npm run typecheck`    | Type-check without emitting               |
| `npm run lint`         | Lint with ESLint                          |
| `npm run format`       | Format with Prettier                      |
| `npm run format:check` | Verify formatting                         |
| `npm test`             | Run the test suite with Vitest            |
