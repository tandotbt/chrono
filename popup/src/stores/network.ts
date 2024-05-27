import { defineStore } from "pinia";

import bg from "@/api/background";
import { CURRENT_NETWORK, NETWORKS } from "@/constants/constants";
import _ from "underscore";
import { useAccounts } from "./account";
import { ref } from "vue";
import type { Network } from "@/types";

export const useNetwork = defineStore("Network", () => {
	const networks = ref<Network[]>([]);
	const network = ref<Network | null>(null);

	const accountsStore = useAccounts();
	async function initNetworks() {
		const initialNetworks: Network[] = [
			{
				id: "0x000000000000",
				name: "odin",
				genesisHash:
					"4582250d0da33b06779a8475d283d5dd210c683b9b999d74d03fac4f58fa6bce",
				gqlEndpoint: "https://odin-rpc-1.nine-chronicles.com/graphql",
				explorerEndpoint: "https://9cscan.com",
				isMainnet: true,
			},
			{
				id: "0x000000000001",
				name: "heimdall",
				genesisHash:
					"729fa26958648a35b53e8e3905d11ec53b1b4929bf5f499884aed7df616f5913",
				gqlEndpoint: "https://heimdall-rpc-1.nine-chronicles.com/graphql",
				explorerEndpoint: "https://heimdall.9cscan.com",
				isMainnet: true,
			},
		] as const;
		await bg.storage.set(NETWORKS, initialNetworks);

		await loadNetworks();

		await selectNetwork("0x000000000000");
	}

	async function deleteNetwork(id: string) {
		await accountsStore.assertSignedIn();
		const fetchedNetworks: Network[] = await bg.storage.get(NETWORKS);
		const newNetworks = fetchedNetworks.filter((network) => network.id !== id);
		await bg.storage.set(NETWORKS, newNetworks);

		await loadNetworks();
		if (network.value?.id === id) {
			await selectNetwork(networks.value[0].id);
		}
	}

	async function importNetwork({
		id,
		name,
		genesisHash,
		gqlEndpoint,
		explorerEndpoint,
		isMainnet,
	}: Network) {
		await accountsStore.assertSignedIn();
		const networks = await bg.storage.get<Network[]>(NETWORKS);
		if (networks.find((network) => network.id === id)) {
			throw new Error(`There is already the network with ${id} id.`);
		}

		networks.push({
			id,
			name,
			genesisHash,
			gqlEndpoint,
			explorerEndpoint,
			isMainnet,
		});
		await bg.storage.set(NETWORKS, networks);

		await loadNetworks();
		await selectNetwork(id);
	}

	async function loadNetworks() {
		await accountsStore.assertSignedIn();
		const fetchedNetworks = await bg.storage.get<Network[]>(NETWORKS);
		if (fetchedNetworks && fetchedNetworks.length > 0) {
			networks.value = fetchedNetworks;
			if (network.value == null) {
				let savedSelected = await bg.storage.get<string>(CURRENT_NETWORK);
				if (
					savedSelected &&
					networks.value.find((network) => network.id === savedSelected)
				) {
					selectNetwork(savedSelected);
				} else {
					selectNetwork(networks.value[0].id);
				}
			}
		}
	}

	async function selectNetwork(id: string) {
		await accountsStore.assertSignedIn();
		const found = networks.value.find((network) => network.id === id);
		if (found) {
			network.value = found;
		}
		await bg.network.switchNetwork(id);
		accountsStore.loadAccounts();
	}

	async function updateNetwork({
		id,
		name,
		gqlEndpoint,
		explorerEndpoint,
		genesisHash,
		isMainnet,
	}: Network) {
		await accountsStore.assertSignedIn();
		const found = networks.value.find((network) => network.id === id);
		if (found) {
			found.name = name;
			found.gqlEndpoint = gqlEndpoint;
			found.genesisHash = genesisHash;
			found.explorerEndpoint = explorerEndpoint;
			found.isMainnet = isMainnet;
		}
		await bg.storage.set(NETWORKS, networks.value);
		accountsStore.loadAccounts();
	}

	return {
		networks,
		network,

		initNetworks,
		deleteNetwork,
		importNetwork,
		loadNetworks,
		selectNetwork,
		updateNetwork,
	};
});
