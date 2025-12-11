# Build stage
FROM node:22-alpine3.23 AS build
RUN apk add --no-cache bash ca-certificates curl
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/jen1/package.json apps/jen1/ ./apps/jen1/
COPY apps/jen1 .
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --silent --filter ./apps/jen1 --frozen-lockfile || pnpm install --silent --filter ./apps/jen1

# Run stage
FROM node:22-alpine3.23
RUN apk add --no-cache bash ca-certificates curl
WORKDIR /app
COPY --from=build /app .
EXPOSE 4001
CMD ["node", "src/index.js"]
