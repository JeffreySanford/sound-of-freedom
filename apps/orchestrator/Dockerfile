# Build stage
FROM node:20-bullseye-slim AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/orchestrator/package.json apps/orchestrator/ ./apps/orchestrator/
COPY apps/orchestrator .
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --silent --filter ./apps/orchestrator --frozen-lockfile || pnpm install --silent --filter ./apps/orchestrator

# Run stage
FROM node:20-bullseye-slim
WORKDIR /app
COPY --from=build /app .
EXPOSE 4000
CMD ["node", "src/index.js"]
