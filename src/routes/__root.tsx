import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import appCss from "@/styles.css?url";
import { AppShell } from "@/components/app-shell";
import { TooltipProvider } from "@/components/ui/tooltip";

/** True for the static GitHub Pages SPA build (client mount into #root). */
const isSpaShell =
  typeof document !== "undefined" && !!document.getElementById("root");

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        title: "Metro Multifamily Market Monitor",
      },
      {
        name: "description",
        content:
          "Multi-market Class A multifamily rental monitor for NJ / NYC metro — rents, concessions, availability, and building comps.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: RootComponent,
});

function AppTree() {
  return (
    <TooltipProvider delayDuration={200}>
      <AppShell>
        <Outlet />
      </AppShell>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: "bg-bg-elevated border border-border text-fg shadow-lg",
            description: "text-fg-muted",
          },
        }}
      />
    </TooltipProvider>
  );
}

function RootComponent() {
  // SPA (GitHub Pages): mount into #root — no document shell.
  if (isSpaShell) {
    return <AppTree />;
  }

  // TanStack Start SSR / dev: full HTML document.
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <AppTree />
        <Scripts />
      </body>
    </html>
  );
}
