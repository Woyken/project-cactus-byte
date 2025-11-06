import { useQuery } from "@tanstack/solid-query";
import type { Accessor } from "solid-js";

const BASE_URL = "https://discgolfmetrix.com";
const BASE_ORIGIN = new URL(BASE_URL).origin;

type CompetitionIdentifier = {
	id: string;
	view?: string;
};

export interface CompetitionBreadcrumb {
	label: string;
	competitionId?: string;
}

export interface CompetitionTab {
	label: string;
	view?: string;
	isActive: boolean;
}

export interface CompetitionParent {
	name: string;
	competitionId?: string;
}

export interface CompetitionCourse {
	name: string;
	courseId?: string;
}

export interface CompetitionPlayerResult {
	position: string;
	name: string;
	playerId?: string;
	initialToPar?: string;
	playedHoles?: string;
	scores: string[];
	totalToPar?: string;
	total?: string;
}

export interface CompetitionDivisionResult {
	name: string;
	playerCount?: number;
	players: CompetitionPlayerResult[];
}

export interface CompetitionResults {
	par: string[];
	totalPar?: string;
	divisions: CompetitionDivisionResult[];
}

export interface CompetitionAction {
	type: "register" | "follow";
	label: string;
}

export interface CompetitionDetails {
	id: string;
	name: string;
	parent?: CompetitionParent;
	startLabel?: string;
	startAt?: string;
	course?: CompetitionCourse;
	location?: string;
	coverImagePath?: string;
	breadcrumbs: CompetitionBreadcrumb[];
	tabs: CompetitionTab[];
	actions: CompetitionAction[];
	comment?: string;
	results?: CompetitionResults;
}

export function useCompetition(
	optionsAccessor: Accessor<CompetitionIdentifier>,
) {
	return useQuery(() => {
		const { id, view } = optionsAccessor();

		return {
			queryKey: ["competition", id, view ?? "default"],
			queryFn: () => fetchCompetitionDetails(id, view),
			enabled: Boolean(id),
			staleTime: 60 * 1000,
		};
	});
}

async function fetchCompetitionDetails(
	id: string,
	view?: string,
): Promise<CompetitionDetails> {
	const targetUrl = buildCompetitionUrl(id, view);
	const response = await fetch(targetUrl, {
		headers: {
			Accept: "text/html,application/xhtml+xml",
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch competition (${response.status})`);
	}

	const html = await response.text();
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, "text/html");

	const sanitizedId = sanitizeId(id);

	return {
		id: sanitizedId,
		name: extractCompetitionName(doc),
		parent: extractParent(doc),
		startLabel: extractStartLabel(doc),
		startAt: extractStartAt(doc),
		course: extractCourse(doc),
		location: extractLocation(doc),
		coverImagePath: extractCoverImagePath(doc),
		breadcrumbs: extractBreadcrumbs(doc),
		tabs: extractTabs(doc, view),
		actions: extractActions(doc),
		comment: extractComment(doc),
		results: extractResults(doc),
	};
}

function sanitizeId(id: string): string {
	return id.replace(/^\//, "").trim();
}

function buildCompetitionUrl(id: string, view?: string): string {
	let href = id.trim();
	if (!href) {
		throw new Error("Competition id is required");
	}

	if (href.startsWith("http")) {
		const url = new URL(href);
		if (view) {
			url.searchParams.set("view", view);
		}
		return url.toString();
	}

	if (!href.startsWith("/")) {
		href = `/${href}`;
	}

	const url = new URL(href, BASE_URL);
	if (view) {
		url.searchParams.set("view", view);
	}
	return url.toString();
}

function extractCompetitionName(doc: Document): string {
	const title = doc.querySelector(".main-header .main-title h1");
	if (!title) {
		return doc.title || "";
	}

	const anchorElements = title.querySelectorAll("a");
	if (anchorElements.length > 0) {
		const lastAnchor = anchorElements[anchorElements.length - 1];
		return lastAnchor.textContent?.trim() ?? title.textContent?.trim() ?? "";
	}

	return title.textContent?.trim() ?? "";
}

function extractParent(doc: Document): CompetitionParent | undefined {
	const title = doc.querySelector(".main-header .main-title h1");
	if (!title) return undefined;
	const anchorElements = title.querySelectorAll("a");
	if (anchorElements.length < 2) return undefined;

	const parentAnchor = anchorElements[
		anchorElements.length - 2
	] as HTMLAnchorElement;
	const parentName = parentAnchor.textContent?.trim();
	if (!parentName) return undefined;

	const href = parentAnchor.getAttribute("href") ?? undefined;
	const competitionId = extractCompetitionIdFromHref(href);

	return {
		name: parentName,
		competitionId,
	};
}

function extractCompetitionIdFromHref(
	href?: string | null,
): string | undefined {
	if (!href) return undefined;
	const match = href.match(/\/(\d+)(?:$|[/?&#])/);
	return match ? match[1] : undefined;
}

function extractCourseIdFromHref(href?: string | null): string | undefined {
	if (!href) return undefined;
	const coursePathMatch = href.match(/course\/(\d+)/i);
	if (coursePathMatch) return coursePathMatch[1];
	const queryMatch = href.match(/course[_-]?id=(\d+)/i);
	return queryMatch ? queryMatch[1] : undefined;
}

function extractPlayerIdFromHref(href?: string | null): string | undefined {
	if (!href) return undefined;
	const pathMatch = href.match(/player\/(\d+)/i);
	if (pathMatch) return pathMatch[1];
	const queryMatch = href.match(/player[_-]?id=(\d+)/i);
	return queryMatch ? queryMatch[1] : undefined;
}

function extractStartLabel(doc: Document): string | undefined {
	const info = doc.querySelector(".main-header p");
	if (!info) return undefined;
	const segments = info.textContent
		?.split("|")
		.map((segment) => segment.replace(/\s+/g, " ").trim())
		.filter(Boolean);
	return segments?.[0];
}

function extractStartAt(doc: Document): string | undefined {
	const label = extractStartLabel(doc);
	if (!label) return undefined;
	const match = label.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
	if (!match) return undefined;
	const [, year, month, day, hours, minutes] = match;
	const date = new Date(
		Date.UTC(
			Number(year),
			Number(month) - 1,
			Number(day),
			Number(hours),
			Number(minutes),
		),
	);
	if (Number.isNaN(date.getTime())) return undefined;
	return date.toISOString();
}

function extractCourse(doc: Document): CompetitionCourse | undefined {
	const info = doc.querySelector(".main-header p");
	const courseAnchor = info?.querySelector("a");
	if (!courseAnchor) return undefined;
	const name = courseAnchor.textContent?.trim();
	if (!name) return undefined;
	const href = courseAnchor.getAttribute("href") ?? undefined;
	return {
		name,
		courseId: extractCourseIdFromHref(href),
	};
}

function extractLocation(doc: Document): string | undefined {
	const info = doc.querySelector(".main-header p");
	if (!info) return undefined;

	const textContent = info.textContent ?? "";
	const segments = textContent
		.split("|")
		.map((segment) => segment.replace(/\s+/g, " ").trim())
		.filter(Boolean);

	if (segments.length === 0) return undefined;
	return segments[segments.length - 1];
}

function extractCoverImagePath(doc: Document): string | undefined {
	const wrapper = doc.querySelector(".cover-image-wrapper");
	const inlineStyle = wrapper?.getAttribute("style") ?? "";
	const match = inlineStyle.match(
		/background-image:\s*url\(['"]?(.*?)['"]?\)/i,
	);
	if (!match) return undefined;
	const raw = match[1]?.trim();
	if (!raw) return undefined;
	try {
		const url = new URL(raw, BASE_URL);
		if (url.origin === BASE_ORIGIN) {
			return url.pathname + url.search;
		}
		return url.toString();
	} catch {
		return raw.startsWith("/") ? raw : undefined;
	}
}

function extractBreadcrumbs(doc: Document): CompetitionBreadcrumb[] {
	const items = Array.from(doc.querySelectorAll(".breadcrumbs li"));
	return items.reduce<CompetitionBreadcrumb[]>((acc, item) => {
		const anchor = item.querySelector("a");
		const strong = item.querySelector("strong");
		const label =
			anchor?.textContent?.trim() ??
			strong?.textContent?.trim() ??
			item.textContent?.trim() ??
			"";
		if (!label) return acc;
		const breadcrumb: CompetitionBreadcrumb = { label };
		const href = anchor?.getAttribute("href");
		breadcrumb.competitionId = extractCompetitionIdFromHref(href);
		acc.push(breadcrumb);
		return acc;
	}, []);
}

function extractTabs(doc: Document, currentView?: string): CompetitionTab[] {
	const items = Array.from(doc.querySelectorAll(".overview ul.tabs li"));
	const seen = new Set<string>();

	return items
		.map((item) => {
			const anchor = item.querySelector("a");
			if (!anchor) return undefined;
			const label = anchor.textContent?.trim() ?? "";
			if (!label) return undefined;
			const href = anchor.getAttribute("href") ?? undefined;
			const view = extractViewValue(href);
			const isActive =
				item.classList.contains("is-active") ||
				anchor.getAttribute("aria-selected") === "true" ||
				(currentView ?? "result") === (view ?? "result");
			const tab: CompetitionTab = {
				label,
				view,
				isActive,
			};
			return tab;
		})
		.filter((tab): tab is CompetitionTab => {
			if (!tab) return false;
			const key = `${tab.label}:${tab.view ?? ""}`.toLowerCase();
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
}

function extractViewValue(href?: string | null): string | undefined {
	if (!href) return undefined;
	try {
		const url = new URL(href, BASE_URL);
		const view = url.searchParams.get("view");
		if (view) return view;
	} catch {
		// Continue with manual parsing fallback.
	}
	const match = href.match(/view=([^&#]+)/i);
	return match ? decodeURIComponent(match[1]) : undefined;
}

function extractActions(doc: Document): CompetitionAction[] {
	const buttons = Array.from(
		doc.querySelectorAll(".button-container a.button"),
	);
	return buttons.reduce<CompetitionAction[]>((acc, anchor) => {
		const label = anchor.textContent?.trim();
		if (!label) return acc;
		if (/register/i.test(label)) {
			acc.push({ type: "register", label });
			return acc;
		}
		if (/follow/i.test(label)) {
			acc.push({ type: "follow", label });
			return acc;
		}
		return acc;
	}, []);
}

function extractComment(doc: Document): string | undefined {
	const items = Array.from(doc.querySelectorAll(".main-header-meta li"));
	const commentItem = items.find((item) => item.querySelector(".fi-comment"));
	if (!commentItem) return undefined;
	const text = commentItem.textContent ?? "";
	return text.replace(/Comment:\s*/i, "").trim() || undefined;
}

function extractResults(doc: Document): CompetitionResults | undefined {
	const table = doc.querySelector("table.score-table");
	if (!table) return undefined;

	const parRow = Array.from(table.querySelectorAll("tr")).find((row) => {
		const cells = row.querySelectorAll("td");
		if (cells.length === 0) return false;
		return /par/i.test(cells[1]?.textContent ?? "");
	});

	const parCells = parRow ? Array.from(parRow.querySelectorAll("td")) : [];
	const parValues = parCells
		.slice(4, parCells.length - 1)
		.map((cell) => cell.textContent?.trim() ?? "");
	const totalPar = parCells[parCells.length - 1]?.textContent?.trim();

	const divisions: CompetitionDivisionResult[] = [];
	const headers = Array.from(table.querySelectorAll("thead"));

	headers.slice(1).forEach((header) => {
		const headerCells = header.querySelectorAll("th");
		if (headerCells.length < 2) return;

		const rawLabel = headerCells[1].textContent?.trim() ?? "";
		if (!rawLabel) return;

		const playerCountMatch = rawLabel.match(/\((\d+)\)/);
		const playerCount = playerCountMatch
			? Number.parseInt(playerCountMatch[1], 10)
			: undefined;
		const name = rawLabel.replace(/\((\d+)\)/, "").trim();

		const division: CompetitionDivisionResult = {
			name,
			playerCount,
			players: [],
		};

		let next: Element | null = header.nextElementSibling;
		while (next && next.tagName !== "THEAD") {
			if (next.tagName === "TBODY") {
				const rows = Array.from(next.querySelectorAll("tr"));
				rows.forEach((row) => {
					const cells = Array.from(row.querySelectorAll("td"));
					if (cells.length === 0) return;

					const nameCell = cells[1];
					const nameText = (
						nameCell?.childNodes?.[0]?.textContent ??
						nameCell?.textContent ??
						""
					).trim();
					if (!nameText) return;

					const profileAnchor = nameCell?.querySelector(
						"a[href*='/player/']",
					) as HTMLAnchorElement | null;

					division.players.push({
						position: cells[0]?.textContent?.trim() ?? "",
						name: nameText,
						playerId: extractPlayerIdFromHref(
							profileAnchor?.getAttribute("href") ?? undefined,
						),
						initialToPar: cells[2]?.textContent?.trim() ?? "",
						playedHoles: cells[3]?.textContent?.trim() ?? "",
						scores: cells
							.slice(4, cells.length - 2)
							.map((cell) => cell.textContent?.trim() ?? ""),
						totalToPar: cells[cells.length - 2]?.textContent?.trim() ?? "",
						total: cells[cells.length - 1]?.textContent?.trim() ?? "",
					});
				});
			}

			next = next.nextElementSibling;
		}

		divisions.push(division);
	});

	if (!parValues.length && divisions.length === 0) {
		return undefined;
	}

	return {
		par: parValues,
		totalPar: totalPar || undefined,
		divisions,
	};
}
