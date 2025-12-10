# Build stage
FROM node:22-alpine AS build
RUN apk add --no-cache bash ca-certificates curl
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/orchestrator/package.json apps/orchestrator/ ./apps/orchestrator/
COPY apps/orchestrator .
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --silent --filter ./apps/orchestrator --frozen-lockfile || pnpm install --silent --filter ./apps/orchestrator
RUN npm i -g npm@11.1.0 || true

# Run stage
FROM node:22-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=build /app .
EXPOSE 4000
COPY apps/orchestrator/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
# Remove npm from run stage to avoid scanning vulnerabilities from npm's bundled packages (e.g., glob)
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx || true
CMD ["/usr/local/bin/entrypoint.sh"]
