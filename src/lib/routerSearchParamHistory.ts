import {
	createBrowserHistory,
	type RouterHistory,
} from "@tanstack/solid-router";

export function createSearchParamHistory(opts: {
	searchParamUrlName: string;
}): RouterHistory {
	const win = window;
	return createBrowserHistory({
		window: win,
		parseLocation: () => {
			const existingSearchParams = new URLSearchParams(win.location.search);
			const urlSearchParamValue = existingSearchParams.get(
				opts.searchParamUrlName,
			);

			const customPathname = urlSearchParamValue?.startsWith("/")
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
			const existingSearchParams = new URLSearchParams(win.location.search);
			// Remove the path param if it exists, we'll add it manually
			existingSearchParams.delete(opts.searchParamUrlName);
			const otherParams = existingSearchParams.toString();
			// Manually construct the query string so path is not encoded
			let query = `${opts.searchParamUrlName}=${fullPath}`;
			if (otherParams) {
				query += `&${otherParams}`;
			}
			const resultHref = `${win.location.pathname}?${query}#${win.location.hash}`;
			return resultHref;
		},
	});
}

function createRandomKey() {
	return (Math.random() + 1).toString(36).substring(7);
}
