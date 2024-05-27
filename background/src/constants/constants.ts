//Must Sync Background & Popup
export const ENCRYPTED_WALLET = "ew";
export const CURRENT_ADDRESS = "ca";
export const ACCOUNTS = "accounts";
export const TXS = "txs";
export const PASSPHRASE = "pp";
export const APPROVAL_REQUESTS = "approval_requests";
export const CONNECTED_SITES = "connected_sites";
export const NETWORKS = "n";
export const CURRENT_NETWORK = "cn";
export const PASSWORD_CHECKER = "passwordChecker";
export const PASSWORD_CHECKER_VALUE = "password";

export interface Account {
	name: string;
	index: number;
	address: string;
	primary?: boolean;
}

export type NetworkId = string;
export type Network = {
	id: NetworkId;
	name: string;
	genesisHash: string;
	gqlEndpoint: string;
	isMainnet: boolean;
};
