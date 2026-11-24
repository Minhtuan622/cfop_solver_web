import helmet from "helmet";

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
        ],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: [
          "'self'",
          "https://raw.githubusercontent.com",
          "https://www.worldcubeassociation.org",
        ],
        workerSrc: ["blob:", "'self'"],
        upgradeInsecureRequests: [],
      },
    }),
  ];
}
