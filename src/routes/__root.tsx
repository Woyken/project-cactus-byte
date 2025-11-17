import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/solid-router";

import { TanStackRouterDevtools } from "@tanstack/solid-router-devtools";
import TanStackQueryProvider from "../integrations/tanstack-query/provider.tsx";
import "@fontsource/inter";

import { SolidQueryDevtools } from "@tanstack/solid-query-devtools";
import Header from "../components/Header";

export const Route = createRootRouteWithContext()({
	head: () => ({
		// links: [{ rel: 'stylesheet', href: styleCss }],
	}),
	shellComponent: RootComponent,
});

function RootComponent() {
	return (
		<>
			<TanStackQueryProvider>
				<HeadContent />

				<Header />

				<Outlet />
				<TanStackRouterDevtools />
				<SolidQueryDevtools />
			</TanStackQueryProvider>

			<Scripts />
		</>
	);
}
