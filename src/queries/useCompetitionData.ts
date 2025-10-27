import { useQuery } from "@tanstack/solid-query";

interface Country {
	code: string;
	name: string;
}

interface Club {
	id: string;
	name: string;
	type?: string;
}

interface Association {
	id: string;
	name: string;
}

interface Course {
	id: string;
	name: string;
	area?: string;
	city?: string;
	latitude?: number;
	longitude?: number;
	distance?: number;
}

interface CompetitionType {
	id: string;
	name: string;
	code: string;
	isPDGA: boolean;
	tier?: string;
}

interface Division {
	id: string;
	name: string;
	code: string;
}

interface Competition {
	id: string;
	name: string;
	date: string;
	startDate: string;
	endDate: string;
	location: string;
	country: Country;
	club?: Club;
	course: Course;
	type: CompetitionType;
	divisions: Division[];
	registrationStatus: RegistrationStatus;
	playerCount?: number;
	maxPlayers?: number;
	isFollowed: boolean;
	isUserAdmin: boolean;
	isUserPlayer: boolean;
	isUserOfficial: boolean;
	comments?: string;
	distance?: number;
	gameMode: string;
}

interface RegistrationStatus {
	isOpen: boolean;
	opensAt?: string;
	closesAt?: string;
	isFull: boolean;
}

interface FilterOptions {
	period: string;
	periodDuration: string;
	dateFrom: string;
	dateTo: string;
	registrationOpen: boolean;
	registrationWillOpen: boolean;
	registrationDateFrom?: string;
	registrationDateTo?: string;
	countryCode?: string;
	countryName?: string;
	myCountry: boolean;
	myClub: boolean;
	clubType?: string;
	clubId?: string;
	clubName?: string;
	associationId?: string;
	courseId?: string;
	courseName?: string;
	courseCloseToMe?: number;
	courseArea?: string;
	courseCity?: string;
	competitionType?: string;
	competitionTypeName?: string;
	division?: string;
	divisionName?: string;
	showMyEvents: boolean;
	showMyAll: boolean;
	competitionName?: string;
	viewMode: string;
	sortBy?: string;
	sortOrder?: string;
}

interface MenuItem {
	id: string;
	label: string;
	url: string;
	isActive: boolean;
}

interface CompetitionDataResponse {
	currentFilters: FilterOptions;
	competitions: Competition[];
	countries: Country[];
	clubs: Club[];
	associations: Association[];
	courses: Course[];
	divisions: Division[];
	menuItems: MenuItem[];
	filterSpecial: string;
	selectedFilterSetName: string;
	selectedFilterSetId: string;
	pageTitle: string;
	baseUrl: string;
}

async function fetchCompetitionData(): Promise<CompetitionDataResponse> {
	const response = await fetch(
		"https://discgolfmetrix.com/?u=competitions_all",
	);
	const html = await response.text();

	const parser = new DOMParser();
	const doc = parser.parseFromString(html, "text/html");

	const scriptContent = extractMainScriptContent(doc);

	const currentFilters = extractCurrentFilters(scriptContent);

	const menuItems = extractMenuItems(doc);

	return {
		currentFilters,
		competitions: [],
		countries: [],
		clubs: [],
		associations: [],
		courses: [],
		divisions: [],
		menuItems,
		filterSpecial: extractJsVariable(scriptContent, "filter_special") || "all",
		selectedFilterSetName:
			extractJsVariable(scriptContent, "filter_set_name") ||
			"Today in my country",
		selectedFilterSetId:
			extractJsVariable(scriptContent, "filter_set_id") || "",
		pageTitle: "Find competition",
		baseUrl: "https://discgolfmetrix.com",
	};
}

function extractJsVariable(html: string, variableName: string): string | null {
	const regex = new RegExp(`${variableName}\\s*=\\s*"([^"]*)"`, "i");
	const match = html.match(regex);
	return match ? match[1] : null;
}

function extractMainScriptContent(doc: Document): string {
	const scripts = doc.querySelectorAll("script:not([src])");

	for (const script of scripts) {
		const content = script.textContent || "";
		if (
			content.includes("filter_special") ||
			content.includes("filter_view") ||
			content.includes("lang = JSON.parse")
		) {
			return content;
		}
	}

	return "";
}

function extractCurrentFilters(scriptContent: string): FilterOptions {
	return {
		period: extractJsVariable(scriptContent, "filter_period") || "",
		periodDuration:
			extractJsVariable(scriptContent, "filter_period_duration") || "1",
		dateFrom: extractJsVariable(scriptContent, "filter_date1") || "",
		dateTo: extractJsVariable(scriptContent, "filter_date2") || "",
		registrationOpen:
			extractJsVariable(scriptContent, "filter_registration_open") === "1",
		registrationWillOpen:
			extractJsVariable(scriptContent, "filter_registration_will_open") === "1",
		registrationDateFrom:
			extractJsVariable(scriptContent, "filter_registration_date1") ||
			undefined,
		registrationDateTo:
			extractJsVariable(scriptContent, "filter_registration_date2") ||
			undefined,
		countryCode:
			extractJsVariable(scriptContent, "filter_country_code") || undefined,
		countryName:
			extractJsVariable(scriptContent, "filter_country_name") || undefined,
		myCountry: extractJsVariable(scriptContent, "filter_my_country") === "1",
		myClub: extractJsVariable(scriptContent, "filter_my_club") === "1",
		clubType: extractJsVariable(scriptContent, "filter_club_type") || undefined,
		clubId: extractJsVariable(scriptContent, "filter_club_id") || undefined,
		clubName: extractJsVariable(scriptContent, "filter_club_name") || undefined,
		associationId:
			extractJsVariable(scriptContent, "filter_association_id") || undefined,
		courseId: extractJsVariable(scriptContent, "filter_course_id") || undefined,
		courseName:
			extractJsVariable(scriptContent, "filter_course_name") || undefined,
		courseCloseToMe: extractJsVariable(
			scriptContent,
			"filter_course_close_to_me",
		)
			? Number.parseInt(
					extractJsVariable(scriptContent, "filter_course_close_to_me") || "0",
					10,
				)
			: undefined,
		courseArea:
			extractJsVariable(scriptContent, "filter_course_area") || undefined,
		courseCity:
			extractJsVariable(scriptContent, "filter_course_city") || undefined,
		competitionType:
			extractJsVariable(scriptContent, "filter_type") || undefined,
		competitionTypeName:
			extractJsVariable(scriptContent, "filter_type_name") || undefined,
		division: extractJsVariable(scriptContent, "filter_division") || undefined,
		divisionName:
			extractJsVariable(scriptContent, "filter_division_name") || undefined,
		showMyEvents: extractJsVariable(scriptContent, "filter_my") === "1",
		showMyAll: extractJsVariable(scriptContent, "filter_my_all") === "1",
		competitionName:
			extractJsVariable(scriptContent, "filter_name") || undefined,
		viewMode: extractJsVariable(scriptContent, "filter_view") || "grid",
		sortBy: extractJsVariable(scriptContent, "filter_sort_name") || undefined,
		sortOrder:
			extractJsVariable(scriptContent, "filter_sort_order") || undefined,
	};
}

function extractMenuItems(doc: Document): MenuItem[] {
	const menuItems: MenuItem[] = [];
	const menuLinks = doc.querySelectorAll(
		"#top-menu-row li a, .off-canvas .menu li a",
	);

	for (const link of menuLinks) {
		const href = link.getAttribute("href") || "";
		const parent = link.parentElement;
		const urlParams = new URLSearchParams(href.split("?")[1] || "");

		menuItems.push({
			id: urlParams.get("u") || href,
			label: link.textContent?.trim() || "",
			url: href,
			isActive: parent?.classList.contains("is-active") || false,
		});
	}

	return menuItems;
}

// Filter presets:
// filter=2 Today in my country
// filter=3 Events near me this week (50km)
// filter=4 Weeklies near me
// filter=21 My played events this year

export function useCompetitionData() {
	return useQuery(() => ({
		queryKey: ["competitionData"],
		queryFn: fetchCompetitionData,
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	}));
}
