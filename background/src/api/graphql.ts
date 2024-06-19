import axios from "axios";
import type { IStorage } from "../storage/index.js";
import {
	CURRENT_NETWORK,
	NETWORKS,
	Network,
	NetworkId,
} from "../constants/constants";

async function getLastBlockIndex(endpoint: string) {
	const response = await fetch(endpoint, {
		method: "POST",
		body: JSON.stringify({
			variables: { offset: 0 },
			query: `
                query getLastBlockIndex($offset: Int!) {
                  chainQuery {
                    blockQuery {
                      blocks(offset: $offset, limit: 1, desc:true) {
                        index
                      }
                    }
                  }
                }
                `,
		}),
		headers: [
			['content-type', 'application/json']
		]
	});

	const data = await response.json();
	return data["data"]["chainQuery"]["blockQuery"]["blocks"][0]["index"];
}

async function getEndpoints(storage: IStorage): Promise<string[]> {
	const currentNetworkId = await storage.get<NetworkId>(CURRENT_NETWORK);
	const networks = await storage.get<Network[]>(NETWORKS);
	const network = networks.find((n) => n.id === currentNetworkId);
	const endpoints = [network.gqlEndpoint];

	const resultEp = {};
	let maxIdx = 0;
	for (const endpoint of endpoints) {
		try {
			const lastIdx = await getLastBlockIndex(endpoint);
			maxIdx = Math.max(maxIdx, lastIdx);
			resultEp[endpoint] = lastIdx;
		} catch (e) {}
	}
	const eps = [];
	for (const endpoint of Object.keys(resultEp)) {
		if (maxIdx - resultEp[endpoint] < 30) {
			eps.push(endpoint);
		}
	}

	if (endpoints.length === 1) {
		return endpoints;
	}

	return endpoints.filter((ep) => eps.indexOf(ep) >= 0);
}

export default class Graphql {
	private readonly storage: Storage;
	private readonly endpoints: string[];
	private readonly canCall: string[];

	constructor(storage, endpoints) {
		this.storage = storage;
		this.endpoints = endpoints;
		this.canCall = [
			"updateNetwork",
			"getLastBlockIndex",
			"getBalance",
			"getTransactionStatus",
			"getNextTxNonce",
			"getTransferAsset",
		];
	}
	canCallExternal(method: string) {
		return this.canCall.indexOf(method) >= 0;
	}

	static async createInstance(storage: IStorage) {
		const endpoints = await getEndpoints(storage);
		return new Graphql(storage, endpoints);
	}

	async callEndpoint<T>(fn: (endpoint: string) => Promise<T>): Promise<T> {
		let exceptions = [];
		for (const endpoint of this.endpoints) {
			try {
				const result = await fn(endpoint);
				return result;
			} catch (e) {
				console.error('e', e);
				exceptions.push(e);
			}
		}

		if (exceptions.length > 0) {
			throw { ...exceptions[0], exceptions };
		}
	}

	async getLastBlockIndex(): Promise<number> {
		return this.callEndpoint(async (endpoint) => {
			return getLastBlockIndex(endpoint);
		});
	}

	async getBalance(address: string): Promise<string> {
		return this.callEndpoint(async (endpoint) => {
			const response = await fetch(endpoint, {
				method: "POST",
				body: JSON.stringify({
					variables: { address: address },
					query: `
                  query getBalance($address: Address!) {
                    goldBalance(address: $address)
                  }
                `,
				}),
				headers: [
					['content-type', 'application/json']
				]
			});

			const data = await response.json();
			return data["data"]["goldBalance"];
		});
	}
	async getNextTxNonce(address: string): Promise<number> {
		return this.callEndpoint(async (endpoint) => {
			const response = await fetch(endpoint, {
				method: "POST",
				body: JSON.stringify({
					variables: { address: address },
					query: `
                  query getNextTxNonce($address: Address!){
                    transaction{
                        nextTxNonce(address: $address)
                    }
                  }
                `,
				}),
				headers: [
					['content-type', 'application/json']
				]
			});

			const data = await response.json();
			return data["data"]["transaction"]["nextTxNonce"];
		});
	}

	async unsignedTx(
		publicKey: string,
		plainValue: string,
		nonce: number,
	): Promise<string> {
		const maxGasPrice = {
			quantity: 1,
			ticker: "Mead",
			decimalPlaces: 18,
		};
		return this.callEndpoint(async (endpoint) => {
			const response = await fetch(endpoint, {
				method: "POST",
				body: JSON.stringify({
					variables: {
						publicKey: publicKey,
						plainValue: plainValue,
						nonce: nonce,
						maxGasPrice: maxGasPrice,
					},
					query: `
                      query unsignedTx($publicKey: String!, $plainValue: String!, $nonce: Long, $maxGasPrice: FungibleAssetValueInputType) {
                        transaction {
                          unsignedTransaction(publicKey: $publicKey, plainValue: $plainValue nonce: $nonce, maxGasPrice: $maxGasPrice)
                        }
                      }
                    `,
				}),
				headers: [
					['content-type', 'application/json']
				]
			});
			const data = await response.json();
			return data["data"]["transaction"]["unsignedTransaction"];
		});
	}

	async getTransferAsset(
		sender: string,
		receiver: string,
		amount: string,
	): Promise<string> {
		return this.callEndpoint(async (endpoint) => {
			const response = await fetch(endpoint, {
				method: "POST",
				body: JSON.stringify({
					variables: { sender: sender, receiver: receiver, amount: amount },
					query: `
                    query getTransferAsset($sender: Address!, $receiver: Address!, $amount: String!){
                      actionQuery {
                        transferAsset(sender: $sender, recipient: $receiver, currency: NCG, amount: $amount)
                      }
                    }
                  `,
				}),
				headers: [
					['content-type', 'application/json']
				]
			});
			const data = await response.json();
			return data["data"]["actionQuery"]["transferAsset"];
		});
	}

	async stageTx(payload: string): Promise<{
		txId: string;
		endpoint: string;
	}> {
		return this.callEndpoint(async (endpoint) => {
			const response = await fetch(endpoint, {
				method: "POST",
				body: JSON.stringify({
					variables: { payload },
					query: `
                      mutation transfer($payload: String!) {
                        stageTransaction(payload: $payload)
                      }
                    `,
				}),
				headers: [
					['content-type', 'application/json']
				]
			});
			const data = await response.json();
			return { txId: data["data"]["stageTransaction"], endpoint };
		});
	}

	async getTransactionStatus({ txId, endpoint }) {
		const response = await fetch(endpoint, {
			method: "POST",
			body: JSON.stringify({
				variables: { txId },
				query: `
                  query query($txId: TxId!) {
                      transaction {
                        transactionResult(txId: $txId) {
                          txStatus
                        }
                      }
                    }
                `,
			}),
			headers: [
				['content-type', 'application/json']
			]
		});
		const data = await response.json();
		return data["data"]["transaction"]["transactionResult"]["txStatus"];
	}
}
