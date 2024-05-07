import { Address, PublicKey } from "@planetarium/account";
import { Value, encode } from "@planetarium/bencodex";
import { WindowMessageHandler } from "./handler";
import { Buffer } from "buffer";
import { encodeUnsignedTx, type UnsignedTx } from "@planetarium/tx";

export class ChronoWallet {
    constructor(private readonly handler: WindowMessageHandler) {}

    getCurrentNetwork(): Promise<{
        id: string,
        name: string,
        genesisHash: string,
        gqlEndpoint: string,
        isMainnet: boolean,
    }> {
        return new Promise((resolve, reject) => {
            this.handler.addEventListener(
                { resolve: (v) => resolve(v), reject },
                { method: 'getCurrentNetwork', }
            );
        });
    }

    switchNetwork(networkId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.handler.addEventListener(
                { resolve: () => resolve(), reject },
                { method: 'switchNetwork', networkId, }
            );
        });
    }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.handler.addEventListener(
                { resolve: () => resolve(), reject },
                { method: 'connect', }
            );
        });
    }

    isConnected(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.handler.addEventListener(
                { resolve: (value: boolean) => resolve(value), reject },
                { method: 'isConnected', }
            );
        });
    }

    sign(signer: Address, action: Value): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            this.handler.addEventListener(
                { resolve: (value: string) => resolve(Buffer.from(value, "hex")), reject },
                { method: 'sign', signer: signer.toString(), action: Buffer.from(encode(action)).toString("hex") }
            );
        });
    }

    signTx(signer: Address, unsignedTx: UnsignedTx): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            this.handler.addEventListener(
                { resolve: (value: string) => resolve(Buffer.from(value, "hex")), reject },
                { method: 'signTx', signer: signer.toString(), utx: Buffer.from(encode(encodeUnsignedTx(unsignedTx))).toString("hex") }
            );
        });
    }

    listAccounts(): Promise<{
        address: Address,
    }[]> {
        return new Promise((resolve, reject) => {
            this.handler.addEventListener(
                {
                    resolve: (value: {
                        address: string,
                    }[]) => resolve(value.map(x => {
                        return {
                            address: Address.fromHex(x.address)
                        };
                    })),
                    reject
                },
                { method: "listAccounts" })
        });
    }

    getPublicKey(address: Address): Promise<PublicKey> {
        return new Promise((resolve, reject) => {
            this.handler.addEventListener(
                {
                    resolve: (value: string) => resolve(PublicKey.fromHex(value, "uncompressed")),
                    reject
                },
                { method: "getPublicKey", address: address.toString(), }
            );
        });
    }
};
