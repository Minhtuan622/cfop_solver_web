# CFOP Solver Studio

Open-source web app to solve, practise, time and compete at CFOP (3×3 Rubik's Cube) online.

[![CI](https://github.com/Minhtuan622/cfop_solver_web/actions/workflows/ci.yml/badge.svg)](https://github.com/Minhtuan622/cfop_solver_web/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Demo

Try the live app: [cfop-solver.studio](https://cfop-solver.studio) (if available).

## Screenshots

| Solver | CFOP solution | Timer |
|--------|---------------|-------|
| ![Solver](docs/screenshots/home.png) | ![Solution](docs/screenshots/solver-solution.png) | ![Timer](docs/screenshots/timer.png) |

| Results | Study | Settings |
|---------|-------|----------|
| ![Results](docs/screenshots/results.png) | ![Study](docs/screenshots/study.png) | ![Settings](docs/screenshots/settings.png) |

Regenerate them with `node scripts/capture-screenshots.mjs` while the dev server is running. The Results page is captured with demo data (eight 3×3 solves seeded into `localStorage`) so it shows metrics, the trend chart and the history list; other pages show the app's default states.

### Dark mode

Every page has a dark mode, including the solver and the 3D cube. Switch **Light/Dark/System** from the menu at the right of the navigation bar (account button → **Appearance**) or in **Settings → Appearance**; the choice is saved in `localStorage` and does not flash on reload thanks to a pre-paint script in `index.html`.

| Home | Timer |
|------|-------|
| ![Home in dark mode](docs/screenshots/home-dark.png) | ![Timer in dark mode](docs/screenshots/timer-dark.png) |

### Mobile

The whole app is responsive on small screens (the shots below are taken at 390×844px, iPhone size): navigation turns into a hamburger menu, content grids collapse to one column, and the Timer and solver stay fully usable on a phone.

| Home | Timer |
|------|-------|
| ![Home on mobile](docs/screenshots/home-mobile.png) | ![Timer on mobile](docs/screenshots/timer-mobile.png) |

## Features

- **Solver (CFOP/BLD):** enter a scramble or the six-face state (by hand or with the camera scanner), per-phase report, 2D/3D cube with move-by-move replay. Openings: Cross, XCross … XXXXCross or "Auto" (tries XXXXCross → XXXCross → XXCross → XCross); search depth is set in Settings from 4 to 12 moves (8 by default). Last Layer recognises OLL/PLL, ZBLL and 1LLL. The cross colour is placed on D and the solution starts with the cube rotation.
- **Timer:** multiple events, WCA-format scrambles (TNoodle formats) held white U · green F; optimal cross length for all 6 colours of each scramble; inspection with audio cues, +2/DNF, metronome; focus mode (everything hides while solving, the time sits in the middle of the screen) and an option to hide the time while solving; Smart Cube and GAN Timer over Bluetooth; replay, statistics and an adjustable scramble font size.
- **Results:** solve history, stats (PB, Ao5, Ao12…), trend chart, event filter, csTimer import and JSON/CSV import and export.
- **Study (SRS):** Last Layer (OLL, PLL, ZBLL, 1LLL), CFOP, 3-Style BLD, 2×2, Pyraminx, Skewb, Square-1, 4×4 Parity, 5×5 L2E, FTO L3T and FTO 2-Look; a 7-day review schedule and a daily goal.
- **Virtual cube:** turn a 3×3 with the keyboard (csTimer-style keys) or on-screen buttons, free play or timed solves.
- **Compete:** account, cross-device sync, competition rooms, weekly/monthly leaderboard, WCA competition calendar with world records.
- The solver runs entirely in the browser: written in Rust and compiled to
  WebAssembly (~300 KB, downloaded on the first solve). The solver and the BLD
  algorithm catalog are kept on the visitor's machine, so they keep working
  offline after the first load.

## Run without a Database

The app can run most client-side features without a Database:

- Solve cube (solver), timer (Timer), study (Study), view local solve history.
- Theme, language and settings customization.

Features that **require** DATABASE_URL:
- CFOP account (sign up/sign in, change password).
- Cloud sync between devices.
- Competition rooms and leaderboard.
- WCA OAuth linking.

## Quick start locally

Requires Node.js 22+, pnpm **10.34.5**, Docker Desktop, Git and **Rust** (stable, via [rustup](https://rustup.rs)) with the WebAssembly target and `wasm-pack`. Local database uses MariaDB via Docker Compose — no need to install MySQL/MariaDB directly on macOS or Windows.

```bash
rustup target add wasm32-unknown-unknown
cargo install wasm-pack --locked
```

`wasm-opt` (Binaryen) is optional: with it the `.wasm` file is about 35% smaller. CI and Docker use release **version_133** from [GitHub](https://github.com/WebAssembly/binaryen/releases/tag/version_133); locally, use that release or newer (`brew install binaryen` on macOS is usually recent enough). Do not use the Debian bookworm `binaryen` package (version 108): it breaks the module and the solver fails to start.

```bash
git clone https://github.com/Minhtuan622/cfop_solver_web.git
cd cfop_solver_web
corepack enable
pnpm install --frozen-lockfile
pnpm build:solver
pnpm db:setup
pnpm dev
```

`pnpm build:solver` compiles the Rust solver in [`packages/solver`](packages/solver) to `packages/solver/solver-wasm/pkg` (glue JS, `.wasm`, TypeScript types). That folder is **not committed**; re-run the command after changing Rust code. `pnpm check`, `pnpm test`, `pnpm dev` and `pnpm build` all need it (`pnpm dev` and `pnpm build` build it themselves when it is missing and `wasm-pack` is installed).

`pnpm db:setup` starts MariaDB at `127.0.0.1:3307`, creates/updates `.env.local` and applies Drizzle migrations. Start Docker Desktop first. Then open `http://localhost:3000`.

Common local database commands:

```bash
pnpm db:stop   # stop container, keep data
pnpm db:logs   # view MariaDB logs
pnpm db:reset  # delete volume and recreate database
```

Account, cloud sync, Rooms and WCA flows require `DATABASE_URL`. WCA OAuth and password-reset email are optional; see [.env.example](.env.example) and [development guide](docs/development/project-guide.md).

## Pre-Pull-Request checklist

```bash
pnpm build:solver
pnpm check
pnpm test --run
pnpm exec playwright install  # first time, if Chromium is not installed
pnpm test:e2e
pnpm build
pnpm audit --prod --audit-level=high
```

`pnpm test:e2e` uses Playwright-managed Chromium (downloaded automatically). No system Chromium path required.

The Rust solver has its own tests, run in `packages/solver`:

```bash
cd packages/solver
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
cargo deny check advisories licenses          # needs cargo-deny (cargo install cargo-deny --locked)
cargo run --release -p cfop --example bench   # Cross/F2L benchmark (p50, p95)
```

`pnpm build` **runs `tsc --noEmit` first**, so a build failure locally is a type error and not just a bundling error. Running `pnpm check` separately is still useful because it is faster (no bundling).

## Automated quality gates

Beyond unit tests and e2e, the repo has a few dedicated gates — all of them run in CI and all of them go **red** on a violation:

| Gate | Command | What it blocks |
|---|---|---|
| Token contrast | `pnpm test --run server/contrast.test.ts` | A main colour pair falling below WCAG AA (4.5:1 for text, 3:1 for the focus ring and status icons) in **both** light and dark mode. |
| Contrast on real pages | `pnpm exec playwright test e2e/contrast-a11y.spec.ts` | New axe violations on the 6 main pages × 2 modes, and a stale known-violations list (`e2e/contrast-a11y.baseline.json`). |
| Solver properties | `cd packages/solver && cargo test --workspace` | A Cross longer than 8 moves, F2L breaking the cross or a solved pair, any of the 216 orientation / 288 permutation last-layer states not solved, an OLL/PLL/ZBLL/1LLL algorithm not producing its own case, any of 5000 random scrambles not ending solved, or a proptest property failing (moves then inverse, 54-sticker round trip, solving random scrambles). |
| Rust advisories and licences | `cd packages/solver && cargo deny check advisories licenses` | A Rust dependency with a RustSec advisory or a licence outside the allow list (`packages/solver/deny.toml`). |
| Flat UI | `pnpm test --run server/flatUi.test.ts` | Shadow classes, borders (`border-*`, `divide-*`), `ring` used as a decorative border, `outline-none`, hard-coded spacing. |
| Solver performance | `node scripts/bench-solver.mjs --check` | The solver (the real WebAssembly build) returning a wrong answer, or either scenario exceeding its budget: `cross` (20s/scramble, 80s total) or `auto` (60s/scramble, 200s total). |
| Release contains the solver | `node scripts/verify-solver-dist.mjs` (last step of `pnpm build`) | `dist` missing the solver worker or a valid `.wasm` file. |
| Preview matches the solver | `pnpm test --run client/src/lib/fastCube.solver.test.ts` | The in-page scramble preview tables disagreeing with the solver for any move (faces, slices, rotations, wide). |

The full contrast report (measurement table, pairs still below target, and the limits of the measurement) lives in [docs/validation/contrast-report.md](docs/validation/contrast-report.md).

## CI

The `CI` workflow runs **3 jobs** in parallel on every push and pull request:

| Job | What it does |
|---|---|
| `Rust solver (fmt, clippy, test)` | `cargo fmt --check`, `cargo clippy -D warnings`, `cargo test` and `cargo deny check advisories licenses` for `packages/solver` |
| `check-test-build` | build the WASM solver (wasm-opt from Binaryen 133, same as Docker) → typecheck → unit tests → e2e → production build → dependency audit |
| `Solver benchmark (WASM)` | measures solver performance in check mode and uploads a JSON artifact to track the trend |

All three are **required status checks** for merging into `main` — see [docs/REPO-OWNER-CHECKLIST.md](docs/REPO-OWNER-CHECKLIST.md).

## Documentation

- [Documentation index](docs/README.md)
- [Short guide for agents and contributors (AGENTS.md)](AGENTS.md)
- [Detailed development guide](docs/development/project-guide.md)
- [Colour contrast report](docs/validation/contrast-report.md)
- [Open work items](TODO.md)
- [Contributing](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security vulnerability reporting](SECURITY.md)

## Tech stack

- Frontend: React 19 + TypeScript 7 + Vite 8, Tailwind CSS 4 and Radix UI; flat UI (no borders, no shadows), token colours for both light and dark mode.
- Backend: Express 5 + tRPC 11, Drizzle ORM, MySQL/MariaDB.
- Cubing.js and Three.js for scrambles and the 3D cube.
- The CFOP solver is written in Rust, compiled to WebAssembly and run in a Web Worker.
- Vitest/Testing Library for unit tests; Playwright for browser E2E.

The solver lives in [`packages/solver`](packages/solver), a Cargo workspace with three crates:

| Crate | Contents |
|---|---|
| `cube-core` | Cubie model (8 corners, 12 edges, 6 centers), every move U R F D L B / M E S / x y z / wide, parsing and formatting, validated conversion to and from the 54-sticker URFDLB string. Standard library only. |
| `cfop` | Cross and F2L (IDA* with pruning tables), 57 OLL cases, 21 PLL cases with AUF, XCross..XXXXCross, ZBLL and 1LLL. |
| `solver-wasm` | wasm-bindgen bindings for the browser; TypeScript types generated with tsify. |

After changing Rust code, run `pnpm build:solver` to rebuild the WebAssembly package (`packages/solver/solver-wasm/pkg`, not committed). Verification results and solver benchmarks: [docs/validation/rust-wasm-solver.md](docs/validation/rust-wasm-solver.md).

## Contributing

Issues, documentation, testing and Pull Requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before getting started.

## Credits

- **FTO case diagrams**: [CubeRoot](https://cuberoot.me/alg/fto) — the PF (9 cases), TL (5), LT (3) and TCP (18 base cases) sets are used as published, with credit. The TCP "(2)" variants (17 cases) are built from the [HCubist](https://hcubist.com/learn/algorithms) FTO 2-Look L3T sheet (freely distributed on the author's site).
- **Pyraminx case diagrams**: [CubeRoot](https://cuberoot.me/alg/pyraminx) — 38/40 cases (5 LL + 33 L4E) used as published, with credit; the 2 cases CubeRoot does not have (L4E-DEF-1, L4E-DEF-4) still use images from cubingapp.com.
- **Skewb case diagrams**: drawn in-house (flat art) with Cubing.js from the case states in the catalog (`scripts/generate-skewb-diagrams.mts`) — the same states as the in-app 3D preview, no cubingapp.com images. Algorithms: **Sarah Strong — Sarah Intermediate & Advanced** (via cubingapp.com).
- **FTO algorithms**: HCubist sheets "FTO 3-Look L3T" and "FTO 2-Look L3T" (Bencisco / CubeRoot) — algorithms shown in the sheet's notation.
- **Diagrams for other lanes** (Last Layer, CFOP, 4×4/5×5…): cubingapp.com — see the notes in the repo.

## License

[MIT](LICENSE)
