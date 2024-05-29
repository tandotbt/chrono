export interface IStorage {
	canCallExternal(method: string): boolean;
	rawSet<T>(name: string, value: T): Promise<void>;
	rawGet<T>(name: string): Promise<T | null>;
	secureSet<T>(name: string, value: T): Promise<void>;
	secureGet<T>(name: string): Promise<T | null>;
	set<T>(name: string, value: T): Promise<void>;
	get<T>(name: string): Promise<T>;
	remove(name: string): Promise<void>;
	has(name: string): Promise<boolean>;
	clearAll(): Promise<void>;
}
