import Graphql from "@/api/graphql";
import Storage from "@/storage/storage";
import { ENCRYPTED_WALLET, TXS, ACCOUNTS } from "@/constants/constants";
import { RawPrivateKey } from "@planetarium/account";
import { BencodexDictionary, decode, encode, isDictionary } from "@planetarium/bencodex";
import * as ethers from "ethers";
import { Address } from "@planetarium/account";
import Decimal from "decimal.js";
import { encodeSignedTx, encodeUnsignedTx, signTx } from "@planetarium/tx";
import { APPROVAL_REQUESTS } from "../constants/constants";
import { nanoid } from "nanoid";

/**
 * @type {Map<number,object>}
 */
const pendingApprovals = new Map();

export default class Wallet {
  constructor(passphrase) {
    this.api = new Graphql();
    this.storage = new Storage(passphrase);
    this.passphrase = passphrase;
    this.canCall = [
      "createSequentialWallet",
      "createPrivateKeyWallet",
      "sendNCG",
      "bridgeWNCG",
      "nextNonce",
      "getPrivateKey",
      "sign",
      "signTx",
      "getApprovalRequests",
      "approveRequest",
      "rejectRequest",
      "listAccounts",
    ];
  }
  canCallExternal(method) {
    return this.canCall.indexOf(method) >= 0;
  }
  hexToBuffer(hex) {
    return Buffer.from(
      ethers.utils.arrayify(hex, { allowMissingPrefix: true })
    );
  }
  decryptWallet(encryptedWalletJson, passphrase) {
    return ethers.Wallet.fromEncryptedJsonSync(
      encryptedWalletJson,
      passphrase || this.passphrase
    );
  }
  async isValidNonce(nonce) {
    let pendingNonce = await this.storage.get("nonce");
    return pendingNonce == nonce;
  }
  async nextNonce(address) {
    let pendingNonce = await this.api.getNextTxNonce(address);
    this.storage.set("nonce", pendingNonce);
    return pendingNonce;
  }
  async createSequentialWallet(primaryAddress, index) {
    let wallet = await this.loadWallet(primaryAddress, this.passphrase);

    let mnemonic = wallet._mnemonic().phrase;

    let newWallet = ethers.Wallet.fromMnemonic(
      mnemonic,
      "m/44'/60'/0'/0/" + index
    );
    let encryptedWallet = await newWallet.encrypt(this.passphrase);
    let address = newWallet.address;

    return { address, encryptedWallet };
  }
  async createPrivateKeyWallet(privateKey) {
    let wallet = new ethers.Wallet(privateKey);
    let encryptedWallet = await wallet.encrypt(this.passphrase);
    let address = wallet.address;

    return { address, encryptedWallet };
  }
  async loadWallet(address, passphrase) {
    let encryptedWallet = await this.storage.secureGet(
      ENCRYPTED_WALLET + address.toLowerCase()
    );
    return this.decryptWallet(encryptedWallet, passphrase);
  }
  async _transferNCG(sender, receiver, amount, nonce, memo) {
    if (!(await this.isValidNonce(nonce))) {
      throw "Invalid Nonce";
    }

    const senderEncryptedWallet = await this.storage.secureGet(
      ENCRYPTED_WALLET + sender.toLowerCase()
    );
    const wallet = await this.loadWallet(sender, this.passphrase);
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
    const utx = decode(utxBytes);
    const signedTx = new BencodexDictionary([
      ...utx,
      [new Uint8Array([0x53]), signature],
    ]);
    const encodedHex = Buffer.from(encode(signedTx)).toString("hex");
    const { txId, endpoint } = await this.api.stageTx(encodedHex);

    return { txId, endpoint };
  }

  async sendNCG(sender, receiver, amount, nonce) {
    let { txId, endpoint } = await this._transferNCG(
      sender,
      receiver,
      amount,
      nonce
    );
    let result = {
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

  async bridgeWNCG(sender, receiver, amount, nonce) {
    let { txId, endpoint } = await this._transferNCG(
      sender,
      "0x9093dd96c4bb6b44a9e0a522e2de49641f146223",
      amount,
      nonce,
      receiver
    );
    let result = {
      id: txId,
      endpoint,
      status: "STAGING",
      action: "bridgeWNCG",
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

  async sign(signer, actionHex) {
    const action = decode(Buffer.from(actionHex, "hex"));
    if (!isDictionary(action)) {
      throw new Error("Invalid action. action must be BencodexDictionary.");
    }

    const wallet = await this.loadWallet(signer, this.passphrase);
    const account = RawPrivateKey.fromHex(wallet.privateKey.slice(2));
    const sender = Address.fromHex(wallet.address);
    const genesisHash = Buffer.from(
      "4582250d0da33b06779a8475d283d5dd210c683b9b999d74d03fac4f58fa6bce",  // Switchable by network.
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

    return this._requestApprove(signer, "sign", convertBencodexToJSONableType(action))
      .then(async () => {
        const signedTx = await this._signTx(signer, unsignedTx);
        return Buffer.from(encode(encodeSignedTx(signedTx))).toString("hex");
      });
  }

  async signTx(signer, encodedUnsignedTxHex) {
    const encodedUnsignedTxBytes = Buffer.from(encodedUnsignedTxHex, "hex");
    const encodedUnsignedTx = decode(encodedUnsignedTxBytes);

    if (!isDictionary(encodedUnsignedTx)) {
      throw new Error("Invalid unsigned tx");
    }

    const wallet = await this.loadWallet(signer, this.passphrase);
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
    const wallet = await this.loadWallet(signer, this.passphrase);
    const account = RawPrivateKey.fromHex(wallet.privateKey.slice(2));

    return await signTx(unsignedTx, account);
  }

  async addPendingTxs(tx) {
    let txs = await this.storage.get(TXS + tx.signer.toLowerCase());
    if (!txs) {
      txs = [];
    }
    txs.unshift(tx);
    await this.storage.set(TXS + tx.signer.toLowerCase(), txs.splice(0, 100));
  }

  async getPrivateKey(address, passphrase) {
    let wallet = await this.loadWallet(address, passphrase);
    return wallet.privateKey;
  }

  async _requestApprove(signer, title, content) {
    const requestId = nanoid();
    await this.addRequest({
      id: requestId,
      signer,
      title,
      content,
    });

    await this._showPopup();

    return new Promise((resolve, reject) => {
      pendingApprovals.set(requestId, { resolve, reject });
    })
  }

  async _showPopup() {
    await chrome.windows.create({ url: "popup/index.html", type: "popup", focused: true, width: 360, height: 600 });
  }

  async hasApprovalRequest() {
    const requests = await this.getApprovalRequests();
    return requests.length > 0;
  }

  async addRequest(request) {
    const requests = await this.getApprovalRequests();
    if (requests.find(({ id }) => id === request.id)) {
      throw new Error("Duplicated request.");
    }

    await this.setApprovalRequests([...requests, request]);
  }

  /**
   * 
   * @param {number} requestId 
   */
  async approveRequest(requestId) {
    const requests = await this.getApprovalRequests();
    await this.setApprovalRequests(requests.filter(({ id }) => id !== requestId));

    const handlers = pendingApprovals.get(requestId);
    console.log(requestId, pendingApprovals);
    if (handlers !== null) {
      handlers.resolve();
    }
  }

  /**
   * 
   * @param {number} requestId 
   */
  async rejectRequest(requestId) {
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
  async getApprovalRequests() {
    const requests = JSON.parse(await this.storage.get(APPROVAL_REQUESTS));
    if (requests === null) {
      return [];
    }

    return requests;
  }

  async listAccounts() {
    const accounts = await this.storage.get(ACCOUNTS);
    console.log(accounts);
    return accounts;
  }

  /**
   * 
   * @param {Array<object>} requests 
   */
  async setApprovalRequests(requests) {
    console.log("setApprovalRequests", requests);
    await this.storage.set(APPROVAL_REQUESTS, JSON.stringify(requests));
  }
}

function convertBencodexToJSONableType(v) {
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
