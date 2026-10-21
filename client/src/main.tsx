import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";
import { DevSupport } from "@react-buddy/ide-toolbox";
import { ComponentPreviews, useInitial } from "../../dev";

// Accordions are below the first interaction path. Defer their Bootstrap data API
// so React, navigation and the initial Studio route can become interactive first.
// A failed optional enhancement must never surface as an unhandled boot error.
window.setTimeout(() => {
  void import("bootstrap/js/dist/collapse").catch((error: unknown) => console.warn("[Bootstrap] Không thể tải collapse enhancement.", error));
}, 0);

// React boundaries cannot see exceptions raised before mounting or by external scripts.
// Keep the browser's native reporting intact while adding context for actionable logs.
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason as { message?: string; stack?: string } | undefined;
  console.error("[Unhandled Promise Rejection]", {
    message: reason?.message ?? String(event.reason),
    stack: reason?.stack,
    url: window.location.href,
  });
});

window.addEventListener("error", (event) => {
  if (event.message === "Script error.") console.warn("[External Script Error] Browser hid stack details for a cross-origin script.", {
    url: window.location.href,
    filename: event.filename,
    line: event.lineno,
    column: event.colno,
  });
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

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <DevSupport ComponentPreviews={ComponentPreviews}
                  useInitialHook={useInitial}
      >
        <App />
      </DevSupport>
    </QueryClientProvider>
  </trpc.Provider>,
);
