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

Regenerate them with `node scripts/capture-screenshots.mjs` while the dev server is running.

## Features

- CFOP/BLD solver: enter a scramble or the six-face state, per-phase report, CubeNet/3D, the "Auto" opening (tries XXXXCross → XXXCross → XXCross → XCross; search depth is configurable in Settings — 8 moves by default) and Last Layer case recognition (OLL/PLL, ZBLL, 1LLL) on the banner and in the phase list.
- Multi-event timer with inspection, +2/DNF, splits, replay, history, statistics and an adjustable scramble font size.
- Study: Last Layer and 3-Style BLD.
- Account, cloud sync, WCA, competition rooms and leaderboard.
- The solver works offline: Pyodide and the BLD algorithm catalog are both
  delivered to the visitor's machine, so there is no CDN dependency after the
  first load.

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

Requires Node.js 22+, pnpm **10.34.5**, Docker Desktop and Git. Local database uses MariaDB via Docker Compose — no need to install MySQL/MariaDB directly on macOS or Windows.

```bash
git clone https://github.com/Minhtuan622/cfop_solver_web.git
cd cfop_solver_web
corepack enable
pnpm install --frozen-lockfile
pnpm db:setup
pnpm dev
```

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
pnpm check
pnpm test --run
pnpm exec playwright install  # first time, if Chromium is not installed
pnpm test:e2e
pnpm build
pnpm audit --prod --audit-level=high
```

`pnpm test:e2e` uses Playwright-managed Chromium (downloaded automatically). No system Chromium path required.

`pnpm build` **runs `tsc --noEmit` first**, so a build failure locally is a type error and not just a bundling error. Running `pnpm check` separately is still useful: it reports errors earlier, before the ~14 MB Pyodide download.

## Automated quality gates

Beyond unit tests and e2e, the repo has a few dedicated gates — all of them run in CI and all of them go **red** on a violation:

| Gate | Command | What it blocks |
|---|---|---|
| Token contrast | `pnpm test --run server/contrast.test.ts` | A main colour pair falling below WCAG AA (4.5:1 for text, 3:1 for the focus ring and status icons) in **both** light and dark mode. |
| Contrast on real pages | `pnpm exec playwright test e2e/contrast-a11y.spec.ts` | New axe violations on the 6 main pages × 2 modes, and a stale known-violations list (`e2e/contrast-a11y.baseline.json`). |
| Solver performance | `node scripts/bench-solver.mjs --check` | The solver returning a wrong answer, one scramble slower than `PER_SCRAMBLE_LIMIT_SEC` (20s by default), or a total above `TOTAL_LIMIT_SEC` (80s by default). |
| Pyodide version pinning | `pnpm test --run server/pyodideAssets.test.ts` | The Pyodide version drifting between the loader, the fetch script and the npm package — which means the benchmark measures the wrong runtime. |
| Deterministic solver bundle | `pnpm test --run server/embedSolver.test.ts` | `embeddedSolver.ts` drifting from the Python source, or being generated differently on Windows and Linux because of line endings. |

The full contrast report (measurement table, pairs still below target, and the limits of the measurement) lives in [docs/validation/contrast-report.md](docs/validation/contrast-report.md).

## CI

The `CI` workflow runs **3 jobs** in parallel:

| Job | What it does |
|---|---|
| `check-test-build` | typecheck → unit tests → verify the solver bundle has not drifted → e2e → production build → dependency audit |
| `Solver tests (pytest)` | the Python test suite in `solver-python` |
| `Solver benchmark (Pyodide)` | measures solver performance in check mode and uploads a JSON artifact to track the trend |

All three are **required status checks** for merging into `main` — see [docs/REPO-OWNER-CHECKLIST.md](docs/REPO-OWNER-CHECKLIST.md).

## Documentation

- [Documentation index](docs/README.md)
- [Detailed development guide](docs/development/project-guide.md)
- [Colour contrast report](docs/validation/contrast-report.md)
- [Open work items](TODO.md)
- [Contributing](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security vulnerability reporting](SECURITY.md)

## Tech stack

- Frontend: React 19 + TypeScript 7 + Vite 8, Tailwind CSS/Studio UI.
- Backend: Express 5 + tRPC 11, Drizzle ORM, MySQL/MariaDB.
- Cubing.js, Three.js and Pyodide Web Worker for scramble, 3D cube and browser solver.
- Vitest/Testing Library for unit tests; Playwright for browser E2E.

Python solver source lives in [`solver-python/cfop_solver`](solver-python/cfop_solver). After editing the Python source, run `pnpm run embed-solver` to regenerate the Pyodide bundle used in the browser; do not edit `client/src/lib/embeddedSolver.ts` by hand.

The bundle must be **committed together with the change**: CI checks with `pnpm run embed-solver && git diff --exit-code client/src/lib/embeddedSolver.ts`, so forgetting to commit it turns the job red. The script normalises line endings when embedding (and `.gitattributes` forces `.py` files to LF) so the bundle is **identical on every OS** — otherwise this check goes red on Linux whenever the bundle was generated on Windows.

## Contributing

Issues, documentation, testing and Pull Requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before getting started.

## License

[MIT](LICENSE)
