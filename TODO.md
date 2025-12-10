TODO / Backlog
=================

- [ ] Module splitting backlog:
  - Move large reducers and effects to feature modules (already done for songGeneration and library) to reduce main bundle size.
  - Split heavy Material imports into feature-specific Material modules and only import into the app root the modules used by the layout.
  - Review feature module sizes using Webpack stats and consider further lazy-loading to reduce initial JS.
  - Ownership: frontend team; Priority: Medium; Notes: follow up with `stats.json` analysis and file a PR for each feature split.
- [ ] Dev workflow: run frontend & backend in separate terminals
  - Terminal A (infra): `docker compose -f docker-compose.yml up -d jen1 muscgen redis ollama orchestrator`
  - Terminal B (api watch): `pnpm run dev:api:watch`  # builds api to dist in watch mode
  - Terminal C (api run): `pnpm run dev:api:run`      # runs the compiled dist with nodemon
  - Terminal D (frontend): `pnpm run dev:frontend -- --port=4201`
  - Ownership: Frontend/Infra; Priority: High; Notes: `dev:api` uses a watch+run pattern to avoid nx executor binary path issues.

  - [ ] Serve / Start (dev) fixes:
    - Resolve `nx` executor "Cannot find module 'nx'" error and ensure `pnpm install` is run in workspace root.
    - Resolve port conflicts (4200) — free port or update `serve` target to allow configurable port.
    - Ensure API serves on the port used by the frontend proxy (default: 3000) or update proxy config.
    - Ownership: Infra / Frontend; Priority: High; Notes: fixes required for local dev and CI runs.

  - [ ] Further reduce initial JS bundle:
    - Move more store slices to feature lazy-loaded modules (candidates: `auth`, `profile`, `jobs`, `datasets`).
    - Audit `AppMaterialModule` and split feature-specific Material imports into feature modules.
    - Use `stats.json` + `webpack-bundle-analyzer` to find and split heavy contributors.
    - Ownership: Frontend; Priority: High; Notes: re-run production builds to verify budgets.

  - [ ] Address per-component CSS over-budget:
    - Identify heavy components (video-generation, video-editing, music-generation, admin, etc.) and move repeated rules to `global-component-styles.scss`.
    - Refactor large components into smaller subcomponents to reduce per-file SCSS size.
    - Ownership: Frontend; Priority: Medium; Notes: follow-up PRs for each component.

  - [ ] Linting & Cleanup:
    - Triage and fix `@typescript-eslint/no-explicit-any` warnings across the frontend.
    - Remove or refactor unused TS files flagged by the build and lint tooling (e.g., `guards/index.ts`, unused selectors).
    - Ownership: Frontend; Priority: Low/Medium.

  - [ ] CI / Budgets / NX Cloud:
    - Ensure budgets are enforced in CI, with budget tuning as required until further splitting is complete.
    - Fix NX Cloud 401 or CI cache configuration issues (if necessary).
    - Ownership: DevOps; Priority: Low/Medium.
