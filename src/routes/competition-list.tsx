import { createFileRoute, Link } from "@tanstack/solid-router";
import Clock from "lucide-solid/icons/clock";
import MapPin from "lucide-solid/icons/map-pin";
import MessageCircle from "lucide-solid/icons/message-circle";
import Users from "lucide-solid/icons/users";
import { createMemo, createSignal, For, Show } from "solid-js";
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
	TextField,
	TextFieldInput,
	TextFieldLabel,
} from "~/components/ui/text-field";
import {
	type EventCompetitionItem,
	type LeagueCompetitionItem,
	useCompetitionList,
} from "~/queries/useCompetitionList";

type Mode = "upcoming" | "past" | "custom";
type UpcomingPreset = "today" | "week" | "month" | "year";
type PastPreset = "yesterday" | "week" | "month" | "year";
type RangeSummary = { start: string; end: string };

const modeOptions: { value: Mode; label: string }[] = [
	{ value: "upcoming", label: "Upcoming" },
	{ value: "past", label: "Past" },
	{ value: "custom", label: "Custom" },
];

const upcomingPresetOptions: { value: UpcomingPreset; label: string }[] = [
	{ value: "today", label: "Today" },
	{ value: "week", label: "Week" },
	{ value: "month", label: "Month" },
	{ value: "year", label: "Year" },
];

const pastPresetOptions: { value: PastPreset; label: string }[] = [
	{ value: "yesterday", label: "Yesterday" },
	{ value: "week", label: "Week" },
	{ value: "month", label: "Month" },
	{ value: "year", label: "Year" },
];

const startOfDay = (date: Date) =>
	new Date(date.getFullYear(), date.getMonth(), date.getDate());

const formatDateInput = (date: Date) => {
	const year = date.getFullYear();
	const month = `${date.getMonth() + 1}`.padStart(2, "0");
	const day = `${date.getDate()}`.padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number) => {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return startOfDay(result);
};

const computeUpcomingRange = (preset: UpcomingPreset): RangeSummary => {
	const start = startOfDay(new Date());
	let end: Date;

	switch (preset) {
		case "today":
			end = start;
			break;
		case "week":
			end = addDays(start, 6);
			break;
		case "month":
			end = addDays(start, 29);
			break;
		case "year":
			end = addDays(start, 364);
			break;
		default:
			end = start;
	}

	return {
		start: formatDateInput(start),
		end: formatDateInput(end),
	};
};

const computePastRange = (preset: PastPreset): RangeSummary => {
	const today = startOfDay(new Date());
	const end = addDays(today, -1);
	let start: Date;

	switch (preset) {
		case "yesterday":
			start = end;
			break;
		case "week":
			start = addDays(end, -6);
			break;
		case "month":
			start = addDays(end, -29);
			break;
		case "year":
			start = addDays(end, -364);
			break;
		default:
			start = end;
	}

	return {
		start: formatDateInput(start),
		end: formatDateInput(end),
	};
};

export const Route = createFileRoute("/competition-list")({
	component: RouteComponent,
});

function RouteComponent() {
	const todayString = formatDateInput(startOfDay(new Date()));
	const [mode, setMode] = createSignal<Mode>("upcoming");
	const [upcomingPreset, setUpcomingPreset] =
		createSignal<UpcomingPreset>("month");
	const [pastPreset, setPastPreset] = createSignal<PastPreset>("month");
	const [customStart, setCustomStart] = createSignal(todayString);
	const [customEnd, setCustomEnd] = createSignal(todayString);

	const filters = createMemo(() => {
		const currentMode = mode();

		if (currentMode === "custom") {
			const start = customStart();
			const end = customEnd();
			return {
				date1: start || undefined,
				date2: end || undefined,
			};
		}

		if (currentMode === "upcoming") {
			const range = computeUpcomingRange(upcomingPreset());
			return {
				date1: range.start,
				date2: range.end,
			};
		}

		const range = computePastRange(pastPreset());
		return {
			date1: range.start,
			date2: range.end,
		};
	});

	const query = useCompetitionList(filters);

	const handleCustomStartChange = (value: string) => {
		setCustomStart(value);
		if (value && customEnd() && value > customEnd()) {
			setCustomEnd(value);
		}
	};

	const handleCustomEndChange = (value: string) => {
		setCustomEnd(value);
		if (value && customStart() && value < customStart()) {
			setCustomStart(value);
		}
	};

	const isCustomRangeDirty = createMemo(
		() => customStart() !== todayString || customEnd() !== todayString,
	);

	const rangeSummary = createMemo<RangeSummary | undefined>(() => {
		const currentMode = mode();
		if (currentMode === "custom") {
			const start = customStart();
			const end = customEnd();
			if (!start || !end) return undefined;
			return { start, end };
		}
		if (currentMode === "upcoming") {
			return computeUpcomingRange(upcomingPreset());
		}
		return computePastRange(pastPreset());
	});

	return (
		<div class="p-4">
			<h1 class="text-2xl font-semibold mb-4">Competitions</h1>

			<div class="mb-6 flex flex-col gap-4">
				<div class="flex flex-wrap gap-2">
					<For each={modeOptions}>
						{(option) => (
							<Button
								type="button"
								variant={mode() === option.value ? "default" : "outline"}
								class="h-9 px-3 capitalize"
								aria-pressed={mode() === option.value}
								onClick={() => setMode(option.value)}
							>
								{option.label}
							</Button>
						)}
					</For>
				</div>

				<Show when={mode() === "upcoming"}>
					<div class="flex flex-wrap gap-2">
						<For each={upcomingPresetOptions}>
							{(preset) => (
								<Button
									type="button"
									variant={
										upcomingPreset() === preset.value ? "default" : "outline"
									}
									class="h-9 px-3 capitalize"
									aria-pressed={upcomingPreset() === preset.value}
									onClick={() => setUpcomingPreset(preset.value)}
								>
									{preset.label}
								</Button>
							)}
						</For>
					</div>
				</Show>

				<Show when={mode() === "past"}>
					<div class="flex flex-wrap gap-2">
						<For each={pastPresetOptions}>
							{(preset) => (
								<Button
									type="button"
									variant={
										pastPreset() === preset.value ? "default" : "outline"
									}
									class="h-9 px-3 capitalize"
									aria-pressed={pastPreset() === preset.value}
									onClick={() => setPastPreset(preset.value)}
								>
									{preset.label}
								</Button>
							)}
						</For>
					</div>
				</Show>

				<Show when={mode() === "custom"}>
					<div class="flex flex-wrap items-end gap-4">
						<TextField class="w-full sm:w-48">
							<TextFieldLabel for="competition-custom-start">
								Start date
							</TextFieldLabel>
							<TextFieldInput
								id="competition-custom-start"
								type="date"
								max={customEnd() || undefined}
								value={customStart()}
								onChange={(event) =>
									handleCustomStartChange(event.currentTarget.value)
								}
							/>
						</TextField>
						<TextField class="w-full sm:w-48">
							<TextFieldLabel for="competition-custom-end">
								End date
							</TextFieldLabel>
							<TextFieldInput
								id="competition-custom-end"
								type="date"
								min={customStart() || undefined}
								value={customEnd()}
								onChange={(event) =>
									handleCustomEndChange(event.currentTarget.value)
								}
							/>
						</TextField>
						<Button
							type="button"
							variant="outline"
							class="h-10"
							disabled={!isCustomRangeDirty()}
							onClick={() => {
								setCustomStart(todayString);
								setCustomEnd(todayString);
							}}
						>
							Reset to today
						</Button>
					</div>
				</Show>

				<Show when={rangeSummary()} keyed>
					{(range) => (
						<div class="text-sm text-muted-foreground">
							Showing competitions from{" "}
							<span class="font-medium">{range.start}</span> to{" "}
							<span class="font-medium">{range.end}</span>
						</div>
					)}
				</Show>
			</div>

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
						<TableHead></TableHead>
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
	const canNavigate = /^[0-9]+$/.test(props.competition.id);

	return (
		<TableRow>
			<TableCell>
				<div class="flex flex-col gap-1">
					<div class="text-lg font-medium">
						{canNavigate ? (
							<Link
								to="/competition/$competitionId"
								params={{ competitionId: props.competition.id }}
								class="text-primary hover:underline"
							>
								{props.competition.name}
							</Link>
						) : (
							props.competition.name
						)}
					</div>
					<div class="text-sm flex gap-1 items-center">
						<Clock />
						<span>
							{new Date(props.competition.timestamp).toLocaleString()}
						</span>
					</div>
					<div class="text-sm flex gap-1 items-center">
						<MapPin />
						<span>{props.competition.course ?? "-"}</span>
						<Show when={props.competition.course && props.competition.location}>
							<span>•</span>
						</Show>
						<span>{props.competition.location ?? "-"}</span>
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
