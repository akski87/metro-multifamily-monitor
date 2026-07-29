import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/** Vite injects BASE_URL (e.g. /metro-multifamily-monitor/ on GH Pages). */
const rawBase = import.meta.env.BASE_URL || "/";
const basepath = rawBase === "/" ? undefined : rawBase.replace(/\/$/, "");

export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
    ...(basepath ? { basepath } : {}),
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
