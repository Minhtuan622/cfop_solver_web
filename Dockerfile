# ---------------------------------------------------------------------------
# Stage "build": full dependency tree plus toolchain, discarded after the build.
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS build

WORKDIR /app

# pnpm is pinned to the version the lockfile was written with.
RUN corepack enable && corepack prepare pnpm@10.34.5 --activate

# Dependencies first, so a source change does not reinstall them.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

COPY . .
# Bản trong image phải có Pyodide cục bộ: build không được lặng lẽ bỏ qua
# bước tải rồi để bộ giải gọi CDN lúc chạy.
ENV REQUIRE_LOCAL_PYODIDE=1
RUN pnpm build

# ---------------------------------------------------------------------------
# Stage "runtime": production dependencies only, no build toolchain.
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.34.5 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile --prod

# Only the build products travel into the runtime image. `.dockerignore`
# keeps every .env file and the git history out, so secrets stay with the
# deployment platform and reach the server as environment variables.
COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# The web server answers /_app/health with its process status.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/_app/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# The server only reads its files, so an unprivileged user is enough.
USER node

CMD ["node", "dist/index.js"]
