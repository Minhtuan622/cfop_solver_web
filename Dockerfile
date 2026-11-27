# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# Stage "solver": Rust toolchain builds the CFOP solver to WebAssembly.
# Only `pkg/` (glue JS, .wasm, .d.ts) leaves this stage.
# ---------------------------------------------------------------------------
FROM rust:1.97-slim-bookworm AS solver

RUN rustup target add wasm32-unknown-unknown

# Tool versions are pinned; wasm-bindgen-cli must match the wasm-bindgen
# crate in packages/solver/Cargo.lock.
RUN --mount=type=cache,id=s/eb7ab89b-d1f4-4cd1-a08c-40976b5b2ae9-/usr/local/cargo/registry,target=/usr/local/cargo/registry \
  cargo install --locked wasm-pack --version 0.15.1 \
  && cargo install --locked wasm-bindgen-cli --version 0.2.130

WORKDIR /app/packages/solver

# Dependencies first: a source change does not re-download crates.
COPY packages/solver/Cargo.toml packages/solver/Cargo.lock ./
COPY packages/solver/cube-core/Cargo.toml cube-core/Cargo.toml
COPY packages/solver/cfop/Cargo.toml cfop/Cargo.toml
COPY packages/solver/solver-wasm/Cargo.toml solver-wasm/Cargo.toml
RUN mkdir -p cube-core/src cfop/src solver-wasm/src \
  && touch cube-core/src/lib.rs cfop/src/lib.rs solver-wasm/src/lib.rs \
  && cargo fetch --locked --target wasm32-unknown-unknown

COPY packages/solver ./
# The cache mounts keep the cargo registry and build directory between
# builds; the artifact is copied out of the cache into the image layer.
RUN --mount=type=cache,id=s/eb7ab89b-d1f4-4cd1-a08c-40976b5b2ae9-/usr/local/cargo/registry,target=/usr/local/cargo/registry \
  --mount=type=cache,id=s/eb7ab89b-d1f4-4cd1-a08c-40976b5b2ae9-/app/packages/solver/target,target=/app/packages/solver/target \
  wasm-pack build solver-wasm --target web --release --out-dir pkg --no-pack

# wasm-opt comes from a pinned Binaryen release (checksum verified by ADD), not
# from apt: Debian bookworm ships Binaryen 108, which breaks the externref table
# that wasm-bindgen 0.2.130 emits. CI uses the same version and flags
# (.github/workflows/ci.yml, scripts/build-solver.mjs).
ARG BINARYEN_VERSION=133
ADD --checksum=sha256:2dc9c7813f5375db93d96ead4b78222fcc3e2677bbb832297af4797782a37489 \
  https://github.com/WebAssembly/binaryen/releases/download/version_${BINARYEN_VERSION}/binaryen-version_${BINARYEN_VERSION}-x86_64-linux.tar.gz \
  /tmp/binaryen.tar.gz
RUN tar -xzf /tmp/binaryen.tar.gz -C /opt \
  && /opt/binaryen-version_${BINARYEN_VERSION}/bin/wasm-opt -Os \
    --enable-bulk-memory --enable-nontrapping-float-to-int --enable-sign-ext --enable-mutable-globals \
    solver-wasm/pkg/solver_wasm_bg.wasm -o solver-wasm/pkg/solver_wasm_bg.wasm \
  && rm -rf /tmp/binaryen.tar.gz /opt/binaryen-version_${BINARYEN_VERSION}

# ---------------------------------------------------------------------------
# Stage "build": Node dependencies and the web build, discarded afterwards.
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS build

WORKDIR /app

# pnpm is pinned to the version the lockfile was written with.
RUN corepack enable && corepack prepare pnpm@10.34.5 --activate

# Dependencies first, so a source change does not reinstall them.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
RUN --mount=type=cache,id=s/eb7ab89b-d1f4-4cd1-a08c-40976b5b2ae9-/root/.local/share/pnpm/store,target=/root/.local/share/pnpm/store \
  pnpm install --frozen-lockfile

COPY . .
COPY --from=solver /app/packages/solver/solver-wasm/pkg ./packages/solver/solver-wasm/pkg
# `pnpm build` kiểm tra dist có đủ worker và .wasm của bộ giải
# (scripts/verify-solver-dist.mjs), nên image thiếu bộ giải không thể build.
RUN pnpm build

# ---------------------------------------------------------------------------
# Stage "runtime": production dependencies and dist/ only, no toolchain.
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
# Migrations run before each deploy (railway.json preDeployCommand).
COPY drizzle ./drizzle
COPY scripts/migrate.mjs ./scripts/migrate.mjs

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# The web server answers /_app/health with its process status.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/_app/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# The server only reads its files, so an unprivileged user is enough.
USER node

CMD ["node", "dist/index.js"]
