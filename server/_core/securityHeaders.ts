import helmet from "helmet";

/**
 * Security headers for the HTTP surface.
 *
 * The Content-Security-Policy ships **report-only** on purpose: the app loads
 * Pyodide from a CDN, the BLD algorithm catalog from raw.githubusercontent.com
 * and runs the solver inside a blob worker. An enforced policy would have to
 * be kept in sync with every third party the app touches.
 *
 * Helmet's own default policy must therefore be switched off. `helmet()`
 * enables an *enforced* `Content-Security-Policy` (`script-src 'self'`, no
 * `connect-src`, no `worker-src`), and shipping it next to the report-only
 * policy broke two things at once:
 *
 * - development: the inline React refresh preamble was blocked, so the app
 *   never mounted ("@vitejs/plugin-react can't detect preamble");
 * - production: Pyodide could not be fetched from the CDN and the solver
 *   worker could not start from a blob URL.
 *
 * Keeping the stack in one module also means the test asserts the headers the
 * server really sends, instead of a copy that can drift.
 */
export function securityHeaders() {
  return [
    helmet({ contentSecurityPolicy: false }),
    helmet.contentSecurityPolicy({
      reportOnly: true,
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        frameAncestors: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        objectSrc: ["'none'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'wasm-unsafe-eval'",
          "blob:",
          "https://cdn.jsdelivr.net",
        ],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://raw.githubusercontent.com",
          "https://www.worldcubeassociation.org",
        ],
        workerSrc: ["blob:", "'self'"],
        upgradeInsecureRequests: [],
      },
    }),
  ];
}
