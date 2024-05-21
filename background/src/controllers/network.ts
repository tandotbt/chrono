import Storage from "@/storage/storage";
import {
	CURRENT_NETWORK,
	NETWORKS,
	type Network,
	type NetworkId,
} from "@/constants/constants";
import { Emitter } from "@/event";

export class NetworkController {
	constructor(
		private readonly storage: Storage,
		private readonly emitter: Emitter,
	) {}

	async switchNetwork(id: string): Promise<void> {
		const networks = await this.storage.get<Network[]>(NETWORKS);
		const found = networks.find((network) => network.id === id);
		if (found) {
			await this.storage.set(CURRENT_NETWORK, found.id);
			this.emitter("network:changed", found);
		} else {
			throw "The storage error";
		}
	}

	async getCurrentNetwork(): Promise<Network> {
		const currentNetworkId = await this.storage.get<NetworkId>(CURRENT_NETWORK);
		const networks = await this.storage.get<Network[]>(NETWORKS);
		const found = networks.find((network) => network.id === currentNetworkId);
		if (found) {
			return found;
		} else {
			throw "The storage error";
		}
	}
}
