import { IStorageBackend } from "./common.js";

export class LocalStorageBackend implements IStorageBackend {
    set<T>(name: string, value: T): Promise<void> {
		return chrome.storage.local.set({ [name]: value });
	}

	get<T>(name: string): Promise<T | null> {
		return new Promise((resolve) => {
			chrome.storage.local.get([name], (res) => {
				resolve((res && res[name]) || null);
			});
		});
	}
}
