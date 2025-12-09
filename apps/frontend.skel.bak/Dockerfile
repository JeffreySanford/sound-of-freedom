# Build stage
FROM node:20-bullseye-slim AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY . .
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --silent --frozen-lockfile || pnpm install --silent
RUN pnpm nx build frontend --configuration=production

# Serve using nginx
FROM nginx:stable
COPY --from=builder /app/dist/apps/frontend /usr/share/nginx/html
EXPOSE 4200
CMD ["nginx", "-g", "daemon off;"]
