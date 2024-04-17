import axios from "axios";

const MAINNET_ENDPOINTS = [
  "https://9c-main-full-state.nine-chronicles.com/graphql",
  "https://9c-main-rpc-2.nine-chronicles.com/graphql"
];
export default class Graphql {
  constructor() {
    this.updateNetwork();
    this.canCall = [
      "updateNetwork",
      "getLastBlockIndex",
      "getBalance",
      "getActivationStatus",
      "getTransactionStatus",
      "getNextTxNonce",
      "getTransferAsset"
    ];
  }
  canCallExternal(method) {
    return this.canCall.indexOf(method) >= 0;
  }

  async updateNetwork(network = "mainnet") {
    let endpoints = null;
    if (network === "mainnet") {
      endpoints = MAINNET_ENDPOINTS;

      if (!this.endpoints) {
        this.endpoints = [...endpoints];
      }

      await this.updateEndpoints(endpoints);
    } else {
      throw "Unknown Network " + network;
    }
  }

  //block index가 30개 이상 뒤쳐지면 제거
  async updateEndpoints(endpoints) {
    let resultEp = {};
    let maxIdx = 0;
    for (let endpoint of endpoints) {
      try {
        let lastIdx = await this.getLastBlockIndex(endpoint);
        maxIdx = Math.max(maxIdx, lastIdx);
        resultEp[endpoint] = lastIdx;
      } catch (e) {}
    }
    let eps = [];
    for (let endpoint of Object.keys(resultEp)) {
      if (maxIdx - resultEp[endpoint] < 30) {
        eps.push(endpoint);
      }
    }

    this.endpoints = endpoints.filter((ep) => eps.indexOf(ep) >= 0);
  }

  async callEndpoint(fn) {
    let exceptions = [];
    for (let endpoint of this.endpoints) {
      try {
        let result = await fn(endpoint);
        return result;
      } catch (e) {
        exceptions.push(e);
      }
    }

    if (exceptions.length > 0) {
      throw { ...exceptions[0], exceptions };
    }
  }

  async getLastBlockIndex(endpoint) {
    let { data } = await axios.create({ timeout: 10000 })({
      method: "POST",
      url: endpoint,
      data: {
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
      },
    });
    return data["data"]["chainQuery"]["blockQuery"]["blocks"][0]["index"];
  }

  async getBalance(address) {
    return this.callEndpoint(async (endpoint) => {
      let { data } = await axios.create({ timeout: 10000 })({
        method: "POST",
        url: endpoint,
        data: {
          variables: { address: address },
          query: `
                  query getBalance($address: Address!) {
                    goldBalance(address: $address)
                  }
                `,
        },
      });

      return data["data"]["goldBalance"];
    });
  }
  async getNextTxNonce(address) {
    return this.callEndpoint(async (endpoint) => {
      let { data } = await axios.create({ timeout: 10000 })({
        method: "POST",
        url: endpoint,
        data: {
          variables: { address: address },
          query: `
                  query getNextTxNonce($address: Address!){
                    transaction{
                        nextTxNonce(address: $address)
                    }
                  }
                `,
        },
      });

      return data["data"]["transaction"]["nextTxNonce"];
    });
  }

  async unsignedTx(publicKey, plainValue, nonce) {
    const maxGasPrice = {
      quantity: 1,
      ticker: 'Mead',
      decimalPlaces: 18
    }
    return this.callEndpoint(async (endpoint) => {
      let { data } = await axios({
        method: "POST",
        url: endpoint,
        data: {
          variables: { publicKey: publicKey, plainValue: plainValue, nonce: nonce, maxGasPrice: maxGasPrice },
          query: `
                      query unsignedTx($publicKey: String!, $plainValue: String!, $nonce: Long, $maxGasPrice: FungibleAssetValueInputType) {
                        transaction {
                          unsignedTransaction(publicKey: $publicKey, plainValue: $plainValue nonce: $nonce, maxGasPrice: $maxGasPrice)
                        }
                      }
                    `,
        },
      });
      return data["data"]["transaction"]["unsignedTransaction"];
    });
  }

  async getTransferAsset(sender, receiver, amount){
  return this.callEndpoint(async (endpoint) => {
    let { data } = await axios({
      method: "POST",
      url: endpoint,
      data: {
        variables: { sender: sender, receiver: receiver, amount: amount },
        query: `
                    query getTransferAsset($sender: Address!, $receiver: Address!, $amount: String!){
                      actionQuery {
                        transferAsset(sender: $sender, recipient: $receiver, currency: NCG, amount: $amount)
                      }
                    }
                  `,
      },
    });
    return data["data"]["actionQuery"]["transferAsset"];
  });
}

  async stageTx(payload) {
    return this.callEndpoint(async (endpoint) => {
      let { data } = await axios({
        method: "POST",
        url: endpoint,
        data: {
          variables: { payload },
          query: `
                      mutation transfer($payload: String!) {
                        stageTransaction(payload: $payload)
                      }
                    `,
        },
      });
      return { txId: data["data"]["stageTransaction"], endpoint };
    });
  }

  async getActivationStatus(address) {
    return this.callEndpoint(async (endpoint) => {
      let { data } = await axios({
        method: "POST",
        url: endpoint,
        data: {
          variables: { address },
          query: `
                      query getPledge($address: Address!) {
                          stateQuery {
                            pledge(agentAddress: $address) {
                              approved
                            }
                          }
                        }
                    `,
        },
      });
      return data["data"]["stateQuery"]["pledge"]["approved"];
    });
  }

  async getTransactionStatus({ txId, endpoint }) {
    let { data } = await axios({
      method: "POST",
      url: endpoint,
      data: {
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
      },
    });
    return data["data"]["transaction"]["transactionResult"]["txStatus"];
  }
}