import { trpc } from "@/lib/trpc";
import { applyTheme, readTheme } from "@/lib/theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import type { ComponentType, ReactElement } from "react";
import superjson from "superjson";
import App from "./App";
import "sonner/dist/styles.css";
import "./index.css";
import "./styles/cube.css";

// React boundaries cannot see exceptions raised before mounting or by external scripts.
// Keep the browser's native reporting intact while adding context for actionable logs.
window.addEventListener("unhandledrejection", event => {
  const reason = event.reason as
    | { message?: string; stack?: string }
    | undefined;
  console.error("[Unhandled Promise Rejection]", {
    message: reason?.message ?? String(event.reason),
    stack: reason?.stack,
    url: window.location.href,
  });
});

window.addEventListener("error", event => {
  if (event.message === "Script error.")
    console.warn(
      "[External Script Error] Browser hid stack details for a cross-origin script.",
      {
        url: window.location.href,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
      }
    );
});

const queryClient = new QueryClient();

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    console.error("[API Query Error]", event.query.state.error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    console.error("[API Mutation Error]", event.mutation.state.error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

// The inline script in index.html already set the theme before the first paint;
// re-applying it here keeps the document in sync with the stored choice.
applyTheme(readTheme());

/**
 * React Buddy is an IDE-only overlay. It is imported dynamically behind
 * `import.meta.env.DEV`, so neither the toolbox nor the preview palette can
 * reach a production chunk or block the first paint.
 */
async function renderApp() {
  let Shell: ComponentType<{ children: ReactElement }> = ({ children }) => (
    <>{children}</>
  );

  if (import.meta.env.DEV) {
    const [{ DevSupport }, { ComponentPreviews, useInitial }] =
      await Promise.all([
        import("@react-buddy/ide-toolbox"),
        import("../../dev"),
      ]);
    Shell = ({ children }) => (
      <DevSupport
        ComponentPreviews={ComponentPreviews}
        useInitialHook={useInitial}
      >
        {children}
      </DevSupport>
    );
  }

  createRoot(document.getElementById("root")!).render(
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Shell>
          <App />
        </Shell>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

void renderApp();
