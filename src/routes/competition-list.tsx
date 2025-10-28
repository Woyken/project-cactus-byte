import { createFileRoute } from "@tanstack/solid-router";
import Clock from "lucide-solid/icons/clock";
import MapPin from "lucide-solid/icons/map-pin";
import MessageCircle from "lucide-solid/icons/message-circle";
import Users from "lucide-solid/icons/users";
import { For, Show } from "solid-js";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import {
	type EventCompetitionItem,
	type LeagueCompetitionItem,
	useCompetitionList,
} from "~/queries/useCompetitionList";

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
							<Show
								when={competition.itemType === "event"}
								fallback={
									<CompetitionLeagueRow
										competition={competition as LeagueCompetitionItem}
									/>
								}
							>
								<CompetitionEventRow
									competition={competition as EventCompetitionItem}
								/>
							</Show>
						)}
					</For>
				</TableBody>
			</Table>

			<div class="flex items-center gap-3 mt-4">
				<Show
					when={query.isFetchingNextPage}
					fallback={<div class="text-sm text-muted">&nbsp;</div>}
				>
					<div class="text-sm">Loading more…</div>
				</Show>

				<Button
					class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
					disabled={!query.hasNextPage || query.isFetchingNextPage}
					onClick={() => query.fetchNextPage()}
				>
					Load more
				</Button>
			</div>
		</div>
	);
}

function CompetitionEventRow(props: { competition: EventCompetitionItem }) {
	return (
		<TableRow>
			<TableCell>
				<div class="flex flex-col gap-1">
					<div class="text-lg font-medium">{props.competition.name}</div>
					<div class="text-sm flex gap-1 items-center">
						<Clock />
						<span>
							{new Date(props.competition.timestamp).toLocaleString()}
						</span>
					</div>
					<div class="text-sm flex gap-1 items-center">
						<MapPin />
						<span>{props.competition.course}</span>
						<span>•</span>
						<span>{props.competition.location}</span>
					</div>
					<div class="text-sm flex gap-1 items-center">
						<Users />
						<span>{props.competition.playerCount ?? "-"}</span>
					</div>
					<Show when={props.competition.comments}>
						{(comments) => (
							<div class="text-sm flex gap-1 items-center">
								<MessageCircle />
								<span>{comments()}</span>
							</div>
						)}
					</Show>
				</div>
			</TableCell>
			<TableCell class="text-right">
				<Show when={props.competition.type}>
					{(type) => <Badge variant="outline">{type()}</Badge>}
				</Show>
			</TableCell>
		</TableRow>
	);
}

function CompetitionLeagueRow(props: { competition: LeagueCompetitionItem }) {
	return (
		<TableRow>
			<TableCell>
				<div class="flex flex-col gap-1">
					<div class="text-lg font-medium">{props.competition.name}</div>
					<div class="text-sm flex gap-1 items-center">
						<Clock />
						<span>
							{new Date(props.competition.rangeStart).toLocaleDateString()} -{" "}
							{new Date(props.competition.rangeEnd).toLocaleDateString()}
						</span>
					</div>
					<div class="text-sm flex gap-1 items-center">
						<Users />
						<span>{props.competition.playerCount ?? "-"}</span>
					</div>
					<Show when={props.competition.comments}>
						{(comments) => (
							<div class="text-sm flex gap-1 items-center">
								<MessageCircle />
								<span>{comments()}</span>
							</div>
						)}
					</Show>
				</div>
			</TableCell>
			<TableCell class="text-right">
				<Show when={props.competition.type}>
					{(type) => <Badge variant="outline">{type()}</Badge>}
				</Show>
			</TableCell>
		</TableRow>
	);
}
