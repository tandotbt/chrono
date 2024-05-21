import Graphql from "@/api/graphql";
import Storage from "@/storage/storage";
import { ENCRYPTED_WALLET, TXS, ACCOUNTS, Account, Network, NetworkId } from "@/constants/constants";
import { RawPrivateKey } from "@planetarium/account";
import { BencodexDictionary, Value, decode, encode, isDictionary } from "@planetarium/bencodex";
import * as ethers from "ethers";
import { Address } from "@planetarium/account";
import Decimal from "decimal.js";
import { encodeSignedTx, encodeUnsignedTx, signTx } from "@planetarium/tx";
import { APPROVAL_REQUESTS, CONNECTED_SITES, CURRENT_NETWORK, NETWORKS } from "../constants/constants";
import { nanoid } from "nanoid";
import { Lazyable, resolve } from "@/utils/lazy"
import { Emitter } from "../event";
import { Buffer } from "buffer";
import { PopupController } from "@/controllers/popup";

interface Request {
  id: string;
  category: string;
  data: unknown;
}

interface SavedTransactionHistory 
{
  id: string,
  endpoint: string,
  status: "STAGING",
  action?: string,
  type: string,
  timestamp: number,
  signer: string,
  data: {
    sender: string,
    receiver: string,
    amount: number,
  },
};


const pendingApprovals = new Map();

export default class Wallet {
  private readonly storage: Storage;
  private readonly api: Graphql;
  private readonly popup: PopupController;
  private readonly passphrase: Lazyable<string>;
  private readonly emitter: Emitter;
  private readonly origin: string | undefined;
  private readonly canCall: string[];

  /**
   * 
   * @param {string | () => string} passphrase 
   * @param {string | undefined} origin
   * @param {import("../event").Emitter} emitter
   */
  constructor(passphrase: Lazyable<string>, origin: string | undefined, storage: Storage, api: Graphql, popupController: PopupController, emitter: Emitter | undefined) {
    this.storage = storage;
    this.api = api;
    this.passphrase = passphrase;
    this.emitter = emitter;
    this.origin = origin;
    this.canCall = [
      "createSequentialWallet",
      "createPrivateKeyWallet",
      "sendNCG",
      "nextNonce",
      "getPrivateKey",
      "sign",
      "signTx",
      "getApprovalRequests",
      "approveRequest",
      "rejectRequest",
      "listAccounts",
      "getPublicKey",
      "connect",
      "isConnected",
      "getCurrentNetwork",
      "switchNetwork",
    ];
  }

  static async createInstance(passphrase: Lazyable<string>, origin: string | undefined, emitter: Emitter | undefined) {
    const storage = new Storage(passphrase);
    const api = await Graphql.createInstance(storage);
    return new Wallet(passphrase, origin, storage, api, emitter);
  }

  canCallExternal(method: string): boolean {
    return this.canCall.indexOf(method) >= 0;
  }
  hexToBuffer(hex: string): Buffer {
    return Buffer.from(
      ethers.utils.arrayify(hex, { allowMissingPrefix: true })
    );
  }
  decryptWallet(encryptedWalletJson: string, passphrase: string): ethers.Wallet {
    return ethers.Wallet.fromEncryptedJsonSync(
      encryptedWalletJson,
      passphrase || resolve(this.passphrase)
    );
  }
  async isValidNonce(nonce) {
    let pendingNonce = await this.storage.get("nonce");
    return pendingNonce == nonce;
  }
  async nextNonce(address: string) {
    let pendingNonce = await this.api.getNextTxNonce(address);
    this.storage.set("nonce", pendingNonce);
    return pendingNonce;
  }
  async createSequentialWallet(primaryAddress: string, index: number) {
    const wallet = await this.loadWallet(primaryAddress, resolve(this.passphrase));

    const mnemonic = wallet._mnemonic().phrase;

    const newWallet = ethers.Wallet.fromMnemonic(
      mnemonic,
      "m/44'/60'/0'/0/" + index
    );
    const encryptedWallet = await newWallet.encrypt(resolve(this.passphrase));
    const address = newWallet.address;

    return { address, encryptedWallet };
  }
  async createPrivateKeyWallet(privateKey: string): Promise<{
    address: string;
    encryptedWallet: string;
  }> {
    const wallet = new ethers.Wallet(privateKey);
    const encryptedWallet = await wallet.encrypt(resolve(this.passphrase));
    const address = wallet.address;

    return { address, encryptedWallet };
  }
  async loadWallet(address: string, passphrase: string): Promise<ethers.Wallet> {
    const encryptedWallet = await this.storage.secureGet<string>(
      ENCRYPTED_WALLET + address.toLowerCase()
    );
    return this.decryptWallet(encryptedWallet, passphrase);
  }
  async _transferNCG(sender, receiver, amount, nonce, memo?) {
    if (!(await this.isValidNonce(nonce))) {
      throw "Invalid Nonce";
    }

    const senderEncryptedWallet = await this.storage.secureGet(
      ENCRYPTED_WALLET + sender.toLowerCase()
    );
    const wallet = await this.loadWallet(sender, resolve(this.passphrase));
    const utxBytes = Buffer.from(await this.api.unsignedTx(
      wallet.publicKey.slice(2),
      await this.api.getTransferAsset(
        wallet.address,
        receiver,
        amount.toString()
      ),
      nonce
    ), "hex");

    const account = RawPrivateKey.fromHex(wallet.privateKey.slice(2));
    const signature = (await account.sign(utxBytes)).toBytes();
    const utx = decode(utxBytes) as BencodexDictionary;
    const signedTx = new BencodexDictionary([
      ...utx,
      [new Uint8Array([0x53]), signature],
    ]);
    const encodedHex = Buffer.from(encode(signedTx)).toString("hex");
    const { txId, endpoint } = await this.api.stageTx(encodedHex);

    return { txId, endpoint };
  }

  async sendNCG(sender, receiver, amount, nonce) {
    const { txId, endpoint } = await this._transferNCG(
      sender,
      receiver,
      amount,
      nonce
    );
    const result: SavedTransactionHistory = {
      id: txId,
      endpoint,
      status: "STAGING",
      type: "transfer_asset5",
      timestamp: +new Date(),
      signer: sender,
      data: {
        sender: sender,
        receiver: receiver,
        amount: amount,
      },
    };

    await this.addPendingTxs(result);
    return result;
  }

  async sign(signer: string, actionHex: string): Promise<string> {
    const action = decode(Buffer.from(actionHex, "hex"));
    if (!isDictionary(action)) {
      throw new Error("Invalid action. action must be BencodexDictionary.");
    }

    return this._requestApprove("sign", {
      signer,
      content: convertBencodexToJSONableType(action),
    })
      .then(async () => {
        const wallet = await this.loadWallet(signer, resolve(this.passphrase));
        const account = RawPrivateKey.fromHex(wallet.privateKey.slice(2));
        const sender = Address.fromHex(wallet.address);
        const currentNetwork = await this.getCurrentNetwork();
        const genesisHash = Buffer.from(
          currentNetwork.genesisHash,
          "hex"
        );

        const actionTypeId = action.get("type_id");
        const gasLimit = typeof actionTypeId === "string" && actionTypeId.startsWith("transfer_asset") ? BigInt(4) : BigInt(1);

        const unsignedTx = {
          signer: sender.toBytes(),
          actions: [action],
          updatedAddresses: new Set([]),
          nonce: BigInt(await this.nextNonce(sender.toString())),
          genesisHash,
          publicKey: (await account.getPublicKey()).toBytes("uncompressed"),
          timestamp: new Date(),
          maxGasPrice: {
            currency: {
              ticker: "Mead",
              decimalPlaces: 18,
              minters: null,
              totalSupplyTrackable: false,
              maximumSupply: null,
            },
            rawValue: BigInt(Decimal.pow(10, 18).toString())
          },
          gasLimit,
        };

        const signedTx = await this._signTx(signer, unsignedTx);
        return Buffer.from(encode(encodeSignedTx(signedTx))).toString("hex");
      });
  }

  async signTx(signer: string, encodedUnsignedTxHex: string): Promise<string> {
    const encodedUnsignedTxBytes = Buffer.from(encodedUnsignedTxHex, "hex");
    const encodedUnsignedTx = decode(encodedUnsignedTxBytes);

    if (!isDictionary(encodedUnsignedTx)) {
      throw new Error("Invalid unsigned tx");
    }

    const wallet = await this.loadWallet(signer, resolve(this.passphrase));
    const account = RawPrivateKey.fromHex(wallet.privateKey);
    const signature = await account.sign(encodedUnsignedTxBytes);

    const SIGNATURE_KEY = new Uint8Array([83]);
    const encodedSignedTx = new BencodexDictionary(
      [
        ...encodedUnsignedTx,
        [SIGNATURE_KEY, signature.toBytes()],
      ]
    );

    return Buffer.from(encode(encodedSignedTx)).toString("hex");
  }

  async _signTx(signer, unsignedTx) {
    const wallet = await this.loadWallet(signer, resolve(this.passphrase));
    const account = RawPrivateKey.fromHex(wallet.privateKey.slice(2));

    return await signTx(unsignedTx, account);
  }

  async addPendingTxs(tx) {
    let txs = await this.storage.get<SavedTransactionHistory[]>(TXS + tx.signer.toLowerCase());
    if (!txs) {
      txs = [];
    }
    txs.unshift(tx);
    await this.storage.set(TXS + tx.signer.toLowerCase(), txs.splice(0, 100));
  }

  async getPrivateKey(address: string, passphrase): Promise<string> {
    let wallet = await this.loadWallet(address, passphrase);
    return wallet.privateKey;
  }

  async connect(): Promise<void> {
    return this._requestApprove("connect", { origin: this.origin, }).then(async (metadata) => {
      const connectedSites = await this._getConnectedSites();
      connectedSites[this.origin] = metadata;
      await this._setConnectedSites(connectedSites);
    });
  }

  async isConnected(): Promise<boolean> {
    const connectedSites = await this._getConnectedSites();
    return connectedSites.hasOwnProperty(this.origin);
  }

  async getCurrentNetwork(): Promise<Network> {
    const currentNetworkId = await this.storage.get<NetworkId>(CURRENT_NETWORK);
    const networks = await this.storage.get<Network[]>(NETWORKS);
    const found = networks.find(network => network.id === currentNetworkId);
    if (found) {
      return found;
    } else {
      throw "The storage error";
    }
  }

  async switchNetwork(id: string): Promise<void> {
    const networks = await this.storage.get<Network[]>(NETWORKS);
    const found = networks.find(network => network.id === id);
    if (found) {
      await this.storage.set(CURRENT_NETWORK, found.id);
      console.log("switchNetwork");
      console.log(this.emitter)
      this.emitter("network:changed", found);
    } else {
      throw "The storage error";
    }
  }

  async _getConnectedSites() {
    return (await this.storage.get(CONNECTED_SITES)) || {};
  }

  async _setConnectedSites(sites) {
    console.log("sites", sites)
    await this.storage.set(CONNECTED_SITES, sites);
  }

  async _requestApprove(category: string, data: unknown) {
    const requestId = nanoid();
    await this.addRequest({
      id: requestId,
      category,
      data,
    });

    await this.popup.show();

    return new Promise((resolve, reject) => {
      pendingApprovals.set(requestId, { resolve, reject });
    })
  }

  async _showPopup(): Promise<void> {
    await chrome.windows.create({ url: "popup/index.html", type: "popup", focused: true, width: 360, height: 600 });
  }

  async hasApprovalRequest(): Promise<boolean> {
    const requests = await this.getApprovalRequests();
    return requests.length > 0;
  }

  async addRequest(request: Request): Promise<void> {
    const requests = await this.getApprovalRequests();
    if (requests.find(({ id }) => id === request.id)) {
      throw new Error("Duplicated request.");
    }

    await this.setApprovalRequests([...requests, request]);
  }

  async approveRequest(requestId: string, metadata) {
    const requests = await this.getApprovalRequests();
    await this.setApprovalRequests(requests.filter(({ id }) => id !== requestId));

    const handlers = pendingApprovals.get(requestId);
    console.log(requestId, pendingApprovals);
    if (handlers !== null) {
      handlers.resolve(metadata);
    }
  }

  async rejectRequest(requestId: string) {
    const requests = await this.getApprovalRequests();
    await this.setApprovalRequests(requests.filter(({ id }) => id !== requestId));

    const handlers = pendingApprovals.get(requestId);
    console.log(requestId, pendingApprovals);
    if (handlers !== null) {
      handlers.reject();
    }
  }

  /**
   * @returns {Promise<Array>}
   */
  async getApprovalRequests(): Promise<Request[]> {
    const requests = JSON.parse(await this.storage.rawGet(APPROVAL_REQUESTS));
    if (requests === null) {
      return [];
    }

    return requests;
  }

  async listAccounts(): Promise<Account[]> {
    const accounts = await this.storage.get<Account[]>(ACCOUNTS);
    if (this.origin) {
      const connectedSites = await this._getConnectedSites();
      const connectedAddresses = connectedSites[this.origin];
      return accounts.filter(x => connectedAddresses.findIndex(addr => addr === x.address) !== -1);
    }

    console.log(accounts);
    return accounts;
  }

  async getPublicKey(address: string): Promise<string> {
    const wallet = await this.loadWallet(address, resolve(this.passphrase));
    return wallet.publicKey;
  }

  async setApprovalRequests(requests: Request[]): Promise<void> {
    console.log("setApprovalRequests", requests);
    await this.storage.rawSet(APPROVAL_REQUESTS, JSON.stringify(requests));
  }
}

function convertBencodexToJSONableType(v: Value) {
  if (v instanceof Array) {
    return v.map(convertBencodexToJSONableType);
  }

  if (isDictionary(v)) {
    const res = {};
    for (const [key, value] of v.entries()) {
      res[convertBencodexToJSONableType(key)] = convertBencodexToJSONableType(value);
    }

    return res;
  }

  if (v instanceof Uint8Array) {
    // if (v.every(x => x >= 97 && x <= 122 || x >= 65 && x <= 90)) {
    //   return "\\xFEFF" + Buffer.from(v).toString("utf-8");
    // }

    return "0x" + Buffer.from(v).toString("hex");
  }

  if (typeof v === "string") {
    return "\uFEFF" + v;
  }

  if (typeof v === "bigint") {
    return v.toString();
  }

  return v;
}
