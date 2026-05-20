# Contributing to Valmar JS

Thanks for improving the Valmar TypeScript SDK.

## Development

Use Bun from the repository root:

```bash
TMPDIR=/tmp bun install --frozen-lockfile
TMPDIR=/tmp bun run typecheck
TMPDIR=/tmp bun test
TMPDIR=/tmp bun run build
TMPDIR=/tmp bun pm pack --dry-run
```

The SDK requires callers to pass their Valmar deployment URL explicitly with `baseUrl`; do not add a default API host.

## Pull Requests

- Keep public API changes reflected in `README.md`.
- Add or update tests for client behavior changes.
- Run typecheck, tests, build, and package dry-run before requesting review.
- Do not commit generated `dist/`, `node_modules/`, package tarballs, logs, or local `.env` files.

## Releases

Releases are published from the public mirror repository through GitHub Actions and npm Trusted Publishing.
