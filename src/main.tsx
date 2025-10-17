import { RouterProvider, createRouter } from "@tanstack/solid-router";
import { render } from "solid-js/web";

import { routeTree } from "./routeTree.gen";
import { createSearchParamHistory } from "./lib/routerSearchParamHistory";
import "./styles.css";

const router = createRouter({
  routeTree,
  // defaultPreload: "intent",
  // scrollRestoration: true,
  // defaultPreloadStaleTime: 0,
  history: createSearchParamHistory({ searchParamUrlName: "path" }),
});

declare module "@tanstack/solid-router" {
  interface Register {
    router: typeof router;
  }
}

function App() {
  setTimeout(() => {
    import("./lazyModule").then(x=>x.test())
  }, 1000)
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

const rootElement = document.getElementById("app");
if (rootElement) {
  render(() => <App />, rootElement);
}
