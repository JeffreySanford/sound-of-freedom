# Build stage
FROM node:20-bookworm-slim AS build
RUN apt-get update && apt-get upgrade -y && apt-get clean && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/jen1/package.json apps/jen1/ ./apps/jen1/
COPY apps/jen1 .
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --silent --filter ./apps/jen1 --frozen-lockfile || pnpm install --silent --filter ./apps/jen1

# Run stage
FROM node:20-bookworm-slim
RUN apt-get update && apt-get upgrade -y && apt-get clean && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app .
EXPOSE 4001
CMD ["node", "src/index.js"]
