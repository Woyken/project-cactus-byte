import { useInfiniteQuery } from "@tanstack/solid-query";

/** Base fields common to all competition list items */
interface BaseCompetitionItem {
	id: string;
	name: string;
	type?: string;
	course?: string;
	location?: string;
	playerCount?: number;
	registrationStatus?: string;
	comments?: string;
}

/** Single event item */
export interface EventCompetitionItem extends BaseCompetitionItem {
	itemType: "event";
	/** unix ms timestamp for the event start */
	timestamp: number;
}

/** League / series item that contains multiple events */
export interface LeagueCompetitionItem extends BaseCompetitionItem {
	itemType: "league";
	/** unix ms start of the series */
	rangeStart: number;
	/** unix ms end of the series */
	rangeEnd: number;
}

export type CompetitionListItem = EventCompetitionItem | LeagueCompetitionItem;

interface PaginationInfo {
	currentPage: number;
	hasPrevious: boolean;
	hasNext: boolean;
}

interface CompetitionListResponse {
	competitions: CompetitionListItem[];
	pagination: PaginationInfo;
}

interface CompetitionListFilters {
	name?: string;
	date1?: string;
	date2?: string;
	registrationDate1?: string;
	registrationDate2?: string;
	registrationOpen?: string;
	registrationWillOpen?: string;
	countryCode?: string;
	clubId?: string;
	clubType?: string;
	associationId?: string;
	courseId?: string;
	closeToMe?: string;
	lat?: string;
	lng?: string;
	area?: string;
	city?: string;
	division?: string;
	my?: string;
	myAll?: string;
	type?: string;
	view?: string;
	sortName?: string;
	sortOrder?: string;
	/** inclusive */
	from: number;
	/** inclusive to - from < max 30 */
	to: number;
	page?: string;
}

async function fetchCompetitionList(
	filters: CompetitionListFilters = { from: 1, to: 30 },
): Promise<CompetitionListResponse> {
	const params = new URLSearchParams();

	// Add all filter parameters
	if (filters.name !== undefined) params.append("name", filters.name);
	if (filters.date1) params.append("date1", filters.date1);
	if (filters.date2) params.append("date2", filters.date2);
	if (filters.registrationDate1)
		params.append("registration_date1", filters.registrationDate1);
	if (filters.registrationDate2)
		params.append("registration_date2", filters.registrationDate2);
	if (filters.registrationOpen)
		params.append("registration_open", filters.registrationOpen);
	if (filters.registrationWillOpen)
		params.append("registration_will_open", filters.registrationWillOpen);
	if (filters.countryCode) params.append("country_code", filters.countryCode);
	if (filters.clubId) {
		params.append("clubid", filters.clubId);
		if (filters.clubType) params.append("clubtype", filters.clubType);
	}
	if (filters.associationId)
		params.append("association_id", filters.associationId);
	if (filters.courseId) params.append("course_id", filters.courseId);
	if (filters.closeToMe) {
		params.append("close_to_me", filters.closeToMe);
		if (filters.lat) params.append("lat", filters.lat);
		if (filters.lng) params.append("lng", filters.lng);
	}
	if (filters.area) params.append("area", filters.area);
	if (filters.city) params.append("city", filters.city);
	if (filters.division) params.append("division", filters.division);
	if (filters.my) params.append("my", filters.my);
	if (filters.myAll) params.append("my_all", filters.myAll);
	if (filters.type) params.append("type", filters.type);
	if (filters.view) params.append("view", filters.view);
	if (filters.sortName) params.append("sort_name", filters.sortName);
	if (filters.sortOrder) params.append("sort_order", filters.sortOrder);

	// Pagination
	params.append("from", String(filters.from));
	params.append("to", String(filters.to));
	params.append("page", filters.page ?? "all");

	const response = await fetch(
		`https://discgolfmetrix.com/competitions_server.php?${params.toString()}`,
	);
	const html = await response.text();

	const parser = new DOMParser();
	const doc = parser.parseFromString(html, "text/html");

	return {
		competitions: parseCompetitions(doc),
		pagination: parsePagination(doc),
	};
}

function parseCompetitions(doc: Document): CompetitionListItem[] {
	const competitions: CompetitionListItem[] = [];
	const cards = doc.querySelectorAll(".column a.gridlist");
	for (const card of cards) {
		const section = card.querySelector("section");
		if (!section) continue;

		const url = card.getAttribute("href") || "";
		const id = url.replace(/^\//, "");

		const name = section.querySelector("h2")?.textContent?.trim() || "";

		const typeSpan = section.querySelector(
			".wrapper-competition-type .competition-type",
		);
		const type = typeSpan?.textContent?.trim();

		const metadataItems = section.querySelectorAll(".metadata-list li");
		let timestamp: number | undefined = undefined;
		let rangeStart: number | undefined = undefined;
		let rangeEnd: number | undefined = undefined;
		let itemType: "event" | "league" = "event";
		let course: string | undefined;
		let location: string | undefined;
		let playerCount: number | undefined;
		let registrationStatus: string | undefined;
		let comments: string | undefined;

		for (const item of metadataItems) {
			const text = item.textContent?.trim() || "";

			// Check icon type to determine field
			if (item.querySelector(".fi-clock")) {
				// text may be a single date/time or a date range (league)
				const clockText = text.replace(/\u2013|\u2014/g, "-").trim();
				const rangeMatch = clockText.match(/(.+?)\s*-\s*(.+)/);
				if (rangeMatch) {
					// treat as league/series when there is a clear date range
					const left = new Date(rangeMatch[1].trim());
					const right = new Date(rangeMatch[2].trim());
					if (!Number.isNaN(left.getTime()) && !Number.isNaN(right.getTime())) {
						rangeStart = left.getTime();
						rangeEnd = right.getTime();
						itemType = "league";
					} else {
						// fallback to parsing full string as a single date
						const single = new Date(clockText);
						if (!Number.isNaN(single.getTime())) timestamp = single.getTime();
					}
				} else {
					const date = new Date(clockText);
					if (!Number.isNaN(date.getTime())) timestamp = date.getTime();
				}
			} else if (item.querySelector('svg use[*|href="#icon_flag_triangle"]')) {
				course = text;
			} else if (item.querySelector('svg use[*|href="#icon_location"]')) {
				location = text;
			} else if (item.querySelector('svg use[*|href="#icon_group"]')) {
				const match = text.match(/Players:\s*(\d+)/);
				if (match) playerCount = Number.parseInt(match[1], 10);
			} else if (item.querySelector(".fi-list-thumbnails")) {
				registrationStatus = text;
			} else if (item.querySelector('svg use[*|href="#icon_speech"]')) {
				comments = text;
			}
		}

		if (
			itemType === "league" &&
			rangeStart !== undefined &&
			rangeEnd !== undefined
		) {
			competitions.push({
				id,
				name,
				type,
				itemType,
				rangeStart,
				rangeEnd,
				course,
				location,
				playerCount,
				registrationStatus,
				comments,
			});
		} else if (itemType === "event" && timestamp !== undefined) {
			competitions.push({
				id,
				name,
				type,
				itemType,
				timestamp,
				course,
				location,
				playerCount,
				registrationStatus,
				comments,
			});
		}
	}

	return competitions;
}

function parsePagination(doc: Document): PaginationInfo {
	const pagination = doc.querySelector(".pagination");
	if (!pagination) {
		return { currentPage: 1, hasPrevious: false, hasNext: false };
	}

	const currentPageElement = pagination.querySelector(".current");
	const currentPage = currentPageElement
		? Number.parseInt(currentPageElement.textContent?.trim() || "1", 10)
		: 1;

	const previousButton = pagination.querySelector(".pagination-previous");
	const hasPrevious =
		previousButton && !previousButton.classList.contains("disabled");

	const nextButton = pagination.querySelector(".pagination-next");
	const hasNext = nextButton && !nextButton.classList.contains("disabled");

	return {
		currentPage,
		hasPrevious: Boolean(hasPrevious),
		hasNext: Boolean(hasNext),
	};
}

export function useCompetitionList(
	filters: Omit<CompetitionListFilters, "from" | "to"> = {},
) {
	return useInfiniteQuery(() => ({
		queryKey: ["competitions", "list", filters],
		queryFn: ({ pageParam }) =>
			fetchCompetitionList({
				...filters,
				from: pageParam.from,
				to: pageParam.to,
			}),
		initialPageParam: { from: 1, to: 30 },
		getNextPageParam: (lastPage, _allPages, lastPageParam) => {
			if (!lastPage.pagination.hasNext) return undefined;
			return {
				from: lastPageParam.to + 1,
				to: lastPageParam.to + 30,
			};
		},
		getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => {
			if (firstPageParam.from <= 1) return undefined;
			return {
				from: Math.max(1, firstPageParam.from - 30),
				to: firstPageParam.from - 1,
			};
		},
		staleTime: 1000 * 60,
	}));
}
