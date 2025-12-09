# Pull Request Checklist

Please check the following before creating a PR. Use the checklist to ensure your PR passes basic requirements and lint checks.

* \[ ] PR branch name follows the guidelines (see `.github/BRANCH_GUIDELINES.md`)
* \[ ] I have updated/added documentation where necessary
* \[ ] I have added/updated unit and integration tests as necessary
* \[ ] I have run `pnpm install` and `pnpm run lint` locally
* \[ ] I have run `pnpm run lint:md` and fixed any Markdown lint warnings
* \[ ] All CI checks pass (including "Markdown Lint" workflow)
* \[ ] If adding models or dataset references, I have included license and provenance summaries

Notes:

* Markdown lint is enforced via Husky + lint-staged and runs on PRs via GitHub Actions.
* If your PR contains large model artifacts, prefer referencing artifacts externally (cloud storage or huggingface link).
