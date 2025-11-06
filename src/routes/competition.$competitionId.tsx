import { createFileRoute, Link } from "@tanstack/solid-router";
import { createMemo, For, Show } from "solid-js";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import {
	type CompetitionDivisionResult,
	type CompetitionParent,
	type CompetitionPlayerResult,
	type CompetitionResults,
	useCompetition,
} from "~/queries/useCompetition";

export const Route = createFileRoute("/competition/$competitionId")({
	validateSearch: (search) =>
		typeof search.view === "string" ? { view: search.view } : {},
	component: CompetitionRoute,
});

function CompetitionRoute() {
	const params = Route.useParams();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();

	const currentView = createMemo(() => search().view ?? "result");

	const query = useCompetition(() => ({
		id: params().competitionId,
		view: currentView(),
	}));

	const handleTabSelect = (nextView?: string) => {
		navigate({
			to: Route.to,
			params: params(),
			search: (previous) => ({
				...(previous ?? {}),
				view: nextView && nextView !== "result" ? nextView : undefined,
			}),
		});
	};

	return (
		<div class="p-4 space-y-6">
			<Show when={query.isLoading}>
				<div>Loading competition…</div>
			</Show>

			<Show when={query.isError}>
				<div class="text-red-600">Error loading competition</div>
			</Show>

			<Show when={query.data} keyed>
				{(competition) => (
					<div class="space-y-6">
						<div class="overflow-hidden rounded-lg border bg-card">
							<Show when={competition.coverImagePath} keyed>
								{(coverPath) => (
									<div
										class="h-48 w-full bg-cover bg-center"
										style={{
											"background-image": `url(${buildCompetitionAssetUrl(coverPath)})`,
										}}
										role="presentation"
									/>
								)}
							</Show>

							<div class="space-y-4 p-4">
								<Show when={competition.breadcrumbs.length}>
									<nav class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
										<For each={competition.breadcrumbs}>
											{(crumb, index) => (
												<span class="flex items-center gap-2">
													<Show
														when={crumb.competitionId}
														keyed
														fallback={<span>{crumb.label}</span>}
													>
														{(competitionId) => (
															<Link
																to="/competition/$competitionId"
																params={{ competitionId }}
																class="text-primary hover:underline"
															>
																{crumb.label}
															</Link>
														)}
													</Show>
													<Show
														when={index() < competition.breadcrumbs.length - 1}
													>
														<span
															aria-hidden="true"
															class="text-muted-foreground"
														>
															/
														</span>
													</Show>
												</span>
											)}
										</For>
									</nav>
								</Show>

								<div class="flex flex-wrap items-center gap-2">
									<h1 class="text-2xl font-semibold">{competition.name}</h1>
									<Show when={competition.parent} keyed>
										{(parent) => (
											<Badge variant="outline" class="text-sm font-normal">
												<ParentLink parent={parent} />
											</Badge>
										)}
									</Show>
								</div>

								<div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
									<Show when={competition.startLabel} keyed>
										{(start) => <span>Starts {start}</span>}
									</Show>

									<Show when={competition.course} keyed>
										{(course) => (
											<span class="flex items-center gap-1">
												Course:
												<span class="font-medium text-foreground">
													{course.name}
												</span>
											</span>
										)}
									</Show>

									<Show when={competition.location} keyed>
										{(location) => <span>Location: {location}</span>}
									</Show>
								</div>

								<Show when={competition.actions.length}>
									<div class="flex flex-wrap gap-3">
										<For each={competition.actions}>
											{(action) => (
												<Button
													type="button"
													variant={
														action.type === "register" ? "default" : "outline"
													}
													disabled
													title="Action handled in upcoming release"
												>
													{action.label}
												</Button>
											)}
										</For>
									</div>
								</Show>

								<Show when={competition.comment} keyed>
									{(comment) => (
										<div class="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
											{comment}
										</div>
									)}
								</Show>
							</div>
						</div>

						<Show when={competition.tabs.length}>
							<div class="flex flex-wrap gap-2">
								<For each={competition.tabs}>
									{(tab) => {
										const tabView = tab.view ?? "result";
										const isActive = tabView === currentView();
										return (
											<Button
												type="button"
												variant={isActive ? "default" : "outline"}
												class="h-9 px-3"
												aria-pressed={isActive}
												onClick={() => handleTabSelect(tab.view)}
											>
												{tab.label}
											</Button>
										);
									}}
								</For>
							</div>
						</Show>

						<Show when={competition.results} keyed>
							{(results) => <CompetitionResultsView results={results} />}
						</Show>
					</div>
				)}
			</Show>
		</div>
	);
}

function ParentLink(props: { parent: CompetitionParent }) {
	const label = `Part of ${props.parent.name}`;
	if (props.parent.competitionId) {
		return (
			<Link
				to="/competition/$competitionId"
				params={{ competitionId: props.parent.competitionId }}
				class="text-primary hover:underline"
			>
				{label}
			</Link>
		);
	}

	return <span>{label}</span>;
}

function CompetitionResultsView(props: { results: CompetitionResults }) {
	return (
		<div class="space-y-4">
			<Show when={props.results.par.length}>
				<div class="rounded-lg border bg-muted/40 p-4">
					<div class="text-sm font-medium text-muted-foreground">
						Par values
					</div>
					<div class="mt-2 flex flex-wrap gap-3 text-sm">
						<For each={props.results.par}>
							{(value, index) => (
								<div class="flex flex-col items-center gap-1">
									<span class="text-xs text-muted-foreground">
										H{index() + 1}
									</span>
									<span class="font-medium">{value || "-"}</span>
								</div>
							)}
						</For>
						<Show when={props.results.totalPar} keyed>
							{(total) => (
								<div class="flex flex-col items-center gap-1 font-semibold">
									<span class="text-xs text-muted-foreground">Total</span>
									<span>{total}</span>
								</div>
							)}
						</Show>
					</div>
				</div>
			</Show>

			<For each={props.results.divisions}>
				{(division) => (
					<DivisionResults division={division} parValues={props.results.par} />
				)}
			</For>
		</div>
	);
}

function DivisionResults(props: {
	division: CompetitionDivisionResult;
	parValues: string[];
}) {
	const columnCount = 4 + props.parValues.length + 2;

	return (
		<div class="overflow-hidden rounded-lg border">
			<div class="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
				<h2 class="text-lg font-semibold">{props.division.name}</h2>
				<div class="text-sm text-muted-foreground">
					Players: {props.division.playerCount ?? props.division.players.length}
				</div>
			</div>

			<Table class="min-w-[720px]">
				<TableHeader>
					<TableRow>
						<TableHead class="w-14">Pos</TableHead>
						<TableHead>Player</TableHead>
						<TableHead class="w-16 text-right">+/-</TableHead>
						<TableHead class="w-20 text-right">Played</TableHead>
						<For each={props.parValues}>
							{(_, index) => (
								<TableHead class="w-12 text-center">H{index() + 1}</TableHead>
							)}
						</For>
						<TableHead class="w-20 text-right">Total +/-</TableHead>
						<TableHead class="w-20 text-right">Total</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<Show
						when={props.division.players.length}
						fallback={
							<TableRow>
								<TableCell
									colSpan={columnCount}
									class="text-center text-sm text-muted-foreground"
								>
									No players for this view yet.
								</TableCell>
							</TableRow>
						}
					>
						<For each={props.division.players}>
							{(player) => (
								<TableRow>
									<TableCell class="text-muted-foreground">
										{player.position || "-"}
									</TableCell>
									<TableCell>
										<PlayerLink player={player} />
									</TableCell>
									<TableCell class="text-right">
										{player.initialToPar || "-"}
									</TableCell>
									<TableCell class="text-right">
										{player.playedHoles || "-"}
									</TableCell>
									<For each={props.parValues}>
										{(_, index) => (
											<TableCell class="text-center">
												{player.scores[index()] || "-"}
											</TableCell>
										)}
									</For>
									<TableCell class="text-right">
										{player.totalToPar || "-"}
									</TableCell>
									<TableCell class="text-right">
										{player.total || "-"}
									</TableCell>
								</TableRow>
							)}
						</For>
					</Show>
				</TableBody>
			</Table>
		</div>
	);
}

function PlayerLink(props: { player: CompetitionPlayerResult }) {
	return <span>{props.player.name}</span>;
}

function buildCompetitionAssetUrl(path: string): string {
	try {
		return new URL(path, "https://discgolfmetrix.com").toString();
	} catch {
		return path;
	}
}
