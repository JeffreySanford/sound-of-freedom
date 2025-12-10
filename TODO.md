TODO / Backlog
=================

- [ ] Module splitting backlog:
  - Move large reducers and effects to feature modules (already done for songGeneration and library) to reduce main bundle size.
  - Split heavy Material imports into feature-specific Material modules and only import into the app root the modules used by the layout.
  - Review feature module sizes using Webpack stats and consider further lazy-loading to reduce initial JS.
  - Ownership: frontend team; Priority: Medium; Notes: follow up with `stats.json` analysis and file a PR for each feature split.
