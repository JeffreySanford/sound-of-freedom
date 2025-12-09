# Build stage
FROM node:20-bullseye-slim AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY . .
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile --silent || pnpm install --silent
RUN pnpm nx build api --prod

# Run stage
FROM node:20-bullseye-slim
WORKDIR /app
COPY --from=build /app/dist/apps/api .
EXPOSE 3333
CMD ["node", "main.js"]
