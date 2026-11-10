import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { siteUrlPlugin } from "../vite.config";

/** A slice of client/index.html carrying every hard-coded studio address. */
const PAGE = `<!doctype html><html lang="vi">
  <head>
    <link rel="canonical" href="https://cfop-solver.studio/" />
    <meta property="og:url" content="https://cfop-solver.studio/" />
    <meta property="og:image" content="https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=hello" />
    <script type="application/ld+json">
      { "@type": "Organization", "url": "https://cfop-solver.studio/", "logo": "https://cfop-solver.studio/logo.png" }
    </script>
    <script type="application/ld+json">
      { "@type": "WebApplication", "potentialAction": { "target": "https://cfop-solver.studio/?q={query}" } }
    </script>
  </head>
  <body></body>
</html>`;

/** Vite calls transformIndexHtml for dev and for the production build. */
function transformed(): string {
  const out = siteUrlPlugin().transformIndexHtml(PAGE);
  return typeof out === "string" ? out : out.html;
}

describe("the site address in the page", () => {
  let original: string | undefined;

  beforeEach(() => {
    original = process.env.VITE_SITE_URL;
  });

  afterEach(() => {
    if (original === undefined) delete process.env.VITE_SITE_URL;
    else process.env.VITE_SITE_URL = original;
  });

  it("writes canonical and structured data addresses from VITE_SITE_URL", () => {
    process.env.VITE_SITE_URL = "https://example.test/";
    const out = transformed();

    expect(out).toContain('href="https://example.test/"');
    expect(out).toContain('content="https://example.test/"');
    expect(out).toContain('"url": "https://example.test/"');
    expect(out).toContain('"logo": "https://example.test/logo.png"');
    expect(out).toContain('"target": "https://example.test/?q={query}"');
    expect(out).not.toContain("cfop-solver.studio");
  });

  it("falls back to the studio address when the variable is unset", () => {
    delete process.env.VITE_SITE_URL;
    const out = transformed();

    expect(out).toContain("https://cfop-solver.studio/");
    expect(out).not.toContain("example.test");
  });
});
