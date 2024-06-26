export const BASE_URL = "https://mimir.nine-chronicles.dev/";

const defaultHeaders: HeadersInit = {
	"Content-Type": "application/json",
};

interface FetchOptions<TBody = undefined> {
	method?: "GET" | "POST";
	body?: TBody;
	headers?: HeadersInit;
}

async function fetchAPI<TResponse, TBody = undefined>(
	endpoint: string,
	options: FetchOptions<TBody> = {},
): Promise<TResponse> {
	try {
		const { method = "GET", body, headers } = options;

		const config: RequestInit = {
			method,
			headers: { ...defaultHeaders, ...headers },
			body: body ? JSON.stringify(body) : null,
		};

		const url = `${BASE_URL}${endpoint}`;

		const response = await fetch(url, config);

		if (!response.ok) {
			throw new Error(`Error: ${response.status}`);
		}

		const contentType = response.headers.get("Content-Type") || "";
		if (contentType.includes("application/json")) {
			return (await response.json()) as TResponse;
		} else if (contentType.includes("text/csv")) {
			return (await response.text()) as unknown as TResponse;
		} else {
			throw new Error(`Unsupported response format: ${contentType}`);
		}
	} catch (error) {
		console.error("Error fetching data:", error);
		throw error;
	}
}

export async function getSheetNames(network: string): Promise<string[]> {
	return await fetchAPI<string[]>(`${network}/sheets/names`);
}

export async function getSheet(network: string, name: string): Promise<string> {
	return await fetchAPI<string>(`${network}/sheets/${name}`, {
		headers: { accept: "text/csv" },
	});
}

interface Avatar {
	avatarAddress: string;
	avatarName: string;
	level: number;
	actionPoint: number;
	dailyRewardReceivedIndex: number;
}

export interface GetAvatarsResponse {
	avatars: Avatar[];
}

export async function getAvatars(
	network: string,
	agentAddress: string,
): Promise<GetAvatarsResponse> {
	return await fetchAPI<GetAvatarsResponse>(
		`${network}/agent/${agentAddress}/avatars`,
		{
			headers: { accept: "application/json" },
		},
	);
}

export async function getTip(network: string): Promise<number> {
	const resp = await fetchAPI<{
		index: number;
	}>(`${network}/tip`, {
		headers: { accept: "application/json" },
	});
	return resp.index;
}
