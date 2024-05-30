import { IStorageBackend } from "@/storage/backend/index.js";

export class InMemoryStorageBackend implements IStorageBackend {
    private readonly map: Map<string, any> = new Map();

    constructor() {
        this.map = new Map();
    }

    get<T>(key: string): Promise<T> {
        return this.map.get(key);
    }

    async set<T>(key: string, value: T): Promise<void> {
        this.map.set(key, value);
    }
}
