import {
    NETWORKS,
    CURRENT_NETWORK,
} from "@/constants/constants";
import bg from "@/api/background";

interface ActionHandlers {
    state: State,
    commit: (name: string, args: unknown) => {},
    dispatch: (name: string, args?: unknown, options?: {
        root?: boolean,
    }) => Promise<void>
}

interface State {
    networks: Network[],
    network: Network,
};

export interface Network {
    id: string,
    name: string,
    genesisHash: string,
    gqlEndpoint: string,
    isMainnet: boolean,
}

export default {
    namespaced: true,
    state() {
        return {
            networks: [],
            network: null,
        }
    },
    getters: {
        networks: (state: State) => state.networks,
        network: (state: State) => state.network,
    },
    mutations: {
        setNetworks(state: State, networks: Network[]) {
            state.networks = networks
        },
        updateNetwork(state: State, {id, name, gqlEndpoint, genesisHash, isMainnet}: Network) {
            const found = state.networks.find(network => network.id === id);
            if (found) {
                found.name = name
                found.gqlEndpoint = gqlEndpoint
                found.genesisHash = genesisHash
                found.isMainnet = isMainnet
            }
        },
        selectNetwork(state: State, id: string) {
            console.log("selectNetwork", state, id);
            const found = state.networks.find(network => network.id === id)
            if (found) {
                state.network = found
            }
        },
    },
    actions: {
        async initNetworks({dispatch}: ActionHandlers) {
            await bg.storage.set(NETWORKS, [
                {
                    id: "0x000000000000",
                    name: 'odin',
                    genesisHash: "4582250d0da33b06779a8475d283d5dd210c683b9b999d74d03fac4f58fa6bce",
                    gqlEndpoint: "https://odin-rpc-1.nine-chronicles.com/graphql",
                    isMainnet: true,
                },
                {
                    id: "0x000000000001",
                    name: 'heimdall',
                    genesisHash: "729fa26958648a35b53e8e3905d11ec53b1b4929bf5f499884aed7df616f5913",
                    gqlEndpoint: "https://heimdall-rpc-1.nine-chronicles.com/graphql",
                    isMainnet: true,
                },
            ]);

            await dispatch('loadNetworks');
            await dispatch('selectNetwork', "0x000000000000");
        },
        async deleteNetwork({state, dispatch}: ActionHandlers, id: string) {
            await dispatch('Account/assertSignedIn', {}, {root: true});
            const networks: Network[] = await bg.storage.get(NETWORKS)
            const newNetworks = networks.filter(network => network.id !== id);
            await bg.storage.set(NETWORKS, newNetworks)

            await dispatch('loadNetworks')
            if (state.network.id === id) {
                await dispatch('selectNetwork', state.networks[0].id)
            }
        },
        async importNetwork({dispatch}: ActionHandlers, {
            id, name, genesisHash, gqlEndpoint,
        }: Network) {
            await dispatch('Account/assertSignedIn', {}, {root: true});
            const networks = await bg.storage.get(NETWORKS)
            networks.push({
                id,
                name,
                genesisHash,
                gqlEndpoint,
            });
            await bg.storage.set(NETWORKS, networks)

            await dispatch('loadNetworks')
            await dispatch('selectNetwork', id);
        },
        async loadNetworks({state, commit, dispatch}: ActionHandlers) {
            await dispatch('Account/assertSignedIn', {}, {root: true});
            const networks = await bg.storage.get(NETWORKS)
            if (networks && networks.length > 0) {
                commit('setNetworks', networks)
                if (state.network == null) {
                    let savedSelected = await bg.storage.get(CURRENT_NETWORK)
                    if (savedSelected && state.networks.find(network => network.id === savedSelected)) {
                        dispatch('selectNetwork', savedSelected)
                    } else {
                        dispatch('selectNetwork', state.networks[0].id)
                    }
                }
            }
        },
        async selectNetwork({commit, dispatch}: ActionHandlers, id: string) {
            await dispatch('Account/assertSignedIn', {}, {root: true});
            await bg.storage.set(CURRENT_NETWORK, id)
            await commit('selectNetwork', id);
            await dispatch('Account/loadAccounts', {}, {root: true});
        },
        async updateNetwork({state, commit, dispatch}: ActionHandlers, network: Network) {
            await dispatch('Account/assertSignedIn', {}, {root: true});
            await commit('updateNetwork', network)
            await bg.storage.set(NETWORKS, state.networks)
            await dispatch('Account/loadAccounts', {}, {root: true});
        },
    }
}
