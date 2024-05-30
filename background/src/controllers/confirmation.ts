import { APPROVAL_REQUESTS } from "@/constants/constants";
import { nanoid } from "nanoid";
import { PopupController } from "./popup";
import { IStorage } from "@/storage";

interface Request {
	id: string;
	category: string;
	data: unknown;
}

type Handlers = {
	resolve: (metadata: unknown) => void;
	reject: () => void;
};

const pendingApprovals: Map<string, Handlers> = new Map();

export class ConfirmationController {
	constructor(
		private readonly storage: IStorage,
		private readonly popupController: PopupController,
	) {}

	async hasApprovalRequest(): Promise<boolean> {
		const requests = await this.getAll();
		return requests.length > 0;
	}

	async request(requestData: Omit<Request, "id">): Promise<unknown> {
		const request: Request = {
			id: nanoid(),
			...requestData,
		};
		const requests = await this.getAll();
		if (requests.find(({ id }) => id === request.id)) {
			throw new Error("Duplicated request.");
		}

		await this.set([...requests, request]);

		const promise = new Promise((resolve, reject) => {
			pendingApprovals.set(request.id, { resolve, reject });
		});

		await this.popupController.show();
		return promise;
	}

	async approve(requestId: string, metadata) {
		const requests = await this.getAll();
		await this.set(requests.filter(({ id }) => id !== requestId));

		const handlers = pendingApprovals.get(requestId);
		console.log(requestId, pendingApprovals);
		if (handlers !== null) {
			handlers.resolve(metadata);
		}
	}

	async reject(requestId: string) {
		const requests = await this.getAll();
		await this.set(requests.filter(({ id }) => id !== requestId));

		const handlers = pendingApprovals.get(requestId);
		console.log(requestId, pendingApprovals);
		if (handlers !== null) {
			handlers.reject();
		}
	}

	/**
	 * @returns {Promise<Array>}
	 */
	async getAll(): Promise<Request[]> {
		const requests = JSON.parse(await this.storage.get(APPROVAL_REQUESTS));
		if (requests === null) {
			return [];
		}

		return requests;
	}

	private async set(requests: Request[]): Promise<void> {
		console.log("setApprovalRequests", requests);
		await this.storage.set(APPROVAL_REQUESTS, JSON.stringify(requests));
	}
}
