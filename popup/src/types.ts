export interface Network {
	id: string;
	name: string;
	genesisHash: string;
	gqlEndpoint: string;
	explorerEndpoint: string;
	isMainnet: boolean;
}

export interface Account {
	name: string;
	index: number;
	address: string;
	primary?: boolean;
	imported?: boolean;
}

export type GraphQLTxStatus =
	| "SUCCESS"
	| "FAILURE"
	| "STAGING"
	| "INCLUDED"
	| "INVALID";

export interface SavedTransactionHistory {
	id: string;
	endpoint: string;
	status: GraphQLTxStatus | "TXUNKNOWN";
	action?: string;
	type: string;
	timestamp: number;
	signer: string;
	data: {
		sender: string;
		receiver: string;
		amount: number;
	};
}

export type ApprovalRequest =
	| {
			id: string;
			category: "connect";
			data: {
				origin: string;
				content: string;
			};
	  }
	| {
			id: string;
			category: "sign";
			data: {
				signer: string;
				content: object;
			};
	  };
