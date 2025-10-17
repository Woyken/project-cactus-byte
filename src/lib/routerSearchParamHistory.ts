import { type RouterHistory, createBrowserHistory } from "@tanstack/solid-router";

export function createSearchParamHistory(opts: {
  searchParamUrlName: string;
}): RouterHistory {
  const win = window;
  return createBrowserHistory({
    window: win,
    parseLocation: () => {
      const existingSearchParams = new URLSearchParams(win.location.search);
      const urlSearchParamValue = existingSearchParams.get(
        opts.searchParamUrlName
      );

      const customPathname =
        urlSearchParamValue && urlSearchParamValue.startsWith("/")
          ? urlSearchParamValue
          : "/";
      const customSearch = (() => {
        if (!urlSearchParamValue) {
          return win.location.search;
        }
        existingSearchParams.delete(opts.searchParamUrlName);
        const rest = existingSearchParams.toString();
        return rest ? `?${rest}` : "";
      })();
      const customHash = win.location.hash;
      const customHref = `${customPathname}${customSearch}${customHash}`;

      const addedKey = createRandomKey();
      const state = win.history.state;

      return {
        hash: customHash,
        pathname: customPathname,
        search: customSearch,
        href: customHref,
        state: state || { ["__TSR_index"]: 0, __TSR_key: addedKey },
      };
    },
    createHref: (fullPath) => {
      const url = URL.parse(`x://x${fullPath}`);
      const existingSearchParams = new URLSearchParams(win.location.search);

      existingSearchParams.set(opts.searchParamUrlName, url?.pathname ?? "/");

      return `${win.location.pathname}?${existingSearchParams.toString()}#${
        win.location.hash
      }`;
    },
  });
}

function createRandomKey() {
  return (Math.random() + 1).toString(36).substring(7);
}
