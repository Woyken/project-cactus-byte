import { createFileRoute } from "@tanstack/solid-router";
import Clock from "lucide-solid/icons/clock";
import MapPin from "lucide-solid/icons/map-pin";
import Users from "lucide-solid/icons/users";
import { For, Show } from "solid-js";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { useCompetitionList } from "~/queries/useCompetitionList";

export const Route = createFileRoute("/competition-list")({
	component: RouteComponent,
});

function RouteComponent() {
	const query = useCompetitionList({
		date1: new Date().toISOString().split("T")[0],
		date2: new Date().toISOString().split("T")[0],
	});

	return (
		<div class="p-4">
			<h1 class="text-2xl font-semibold mb-4">Competitions</h1>

			<Show when={query.isLoading} fallback={null}>
				<div>Loading competitions…</div>
			</Show>

			<Show when={query.isError} fallback={null}>
				<div class="text-red-600">Error loading competitions</div>
			</Show>

			<Table>
				<TableCaption>List of competitions</TableCaption>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead class="text-right">Location</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<For
						each={query.data?.pages.flatMap((page) => page.competitions) ?? []}
					>
						{(competition) => (
							<TableRow>
								<TableCell>
									<div class="flex flex-col gap-1">
										<div class="text-lg font-medium">{competition.name}</div>
										<div class="text-sm flex gap-1 items-center">
											<Clock />
											<span>
												{new Date(competition.timestamp).toLocaleString()}
											</span>
										</div>
										<div class="text-sm flex gap-1 items-center">
											<MapPin />
											<span>{competition.course}</span>
											<span>•</span>
											<span>{competition.location}</span>
										</div>
										<div class="text-sm flex gap-1 items-center">
											<Users />
											<span>{competition.playerCount ?? "-"}</span>
										</div>
									</div>
								</TableCell>
								<TableCell class="text-right">
									<MapPin />
									{competition.location}
								</TableCell>
							</TableRow>
						)}
					</For>
				</TableBody>
			</Table>
			<For each={query.data?.pages ?? []} fallback={<div>No competitions</div>}>
				{(page) => (
					<div class="mb-6">
						<For each={page.competitions}>
							{(competition) => (
								<article class="border rounded p-3 mb-3">
									<div class="flex items-start gap-4">
										<div class="flex-1">
											<div class="text-lg font-medium">{competition.name}</div>
											<div class="text-sm text-muted">ID: {competition.id}</div>
											<div class="text-sm">{competition.timestamp}</div>
											<div class="text-sm">{competition.course}</div>
											<div class="text-sm">{competition.location}</div>
										</div>
										<div class="text-right">
											<div>{competition.playerCount ?? "-"} players</div>
											<div class="text-sm">
												{competition.registrationStatus}
											</div>
										</div>
									</div>
									<Show when={competition.comments}>
										<p class="mt-2 text-sm">{competition.comments}</p>
									</Show>
								</article>
							)}
						</For>
					</div>
				)}
			</For>

			<div class="flex items-center gap-3 mt-4">
				<Show
					when={query.isFetchingNextPage}
					fallback={<div class="text-sm text-muted">&nbsp;</div>}
				>
					<div class="text-sm">Loading more…</div>
				</Show>

				<button
					type="button"
					class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
					disabled={!query.hasNextPage || query.isFetchingNextPage}
					onClick={() => query.fetchNextPage()}
				>
					Load more
				</button>
			</div>
		</div>
	);
}
