import { Address, PublicKey } from "@planetarium/account";
import { Value, encode } from "@planetarium/bencodex";
import { WindowMessageHandler } from "./handler";
import { Buffer } from "buffer";
import { encodeUnsignedTx, type UnsignedTx } from "@planetarium/tx";
import { EventType, EventHandler, Network } from "./event";

export class ChronoWallet {
    constructor(private readonly handler: WindowMessageHandler) {}

    subscribe<T extends EventType>(event: EventType, handler: EventHandler<T>): void {
        this.handler.subscribe(event, handler);
    }

    unsubscribe<T extends EventType>(event: EventType, handler: EventHandler<T>): void {
        this.handler.unsubscribe(event, handler);
    }

    getCurrentNetwork(): Promise<Network> {
        return new Promise((resolve, reject) => {
            this.handler.send(
                { resolve: (v) => resolve(v), reject },
                { method: 'getCurrentNetwork', }
            );
        });
    }

    switchNetwork(networkId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.handler.send(
                { resolve: () => resolve(), reject },
                { method: 'switchNetwork', networkId, }
            );
        });
    }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.handler.send(
                { resolve: () => resolve(), reject },
                { method: 'connect', }
            );
        });
    }

    isConnected(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.handler.send(
                { resolve: (value: boolean) => resolve(value), reject },
                { method: 'isConnected', }
            );
        });
    }

    sign(signer: Address, action: Value): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            this.handler.send(
                { resolve: (value: string) => resolve(Buffer.from(value, "hex")), reject },
                { method: 'sign', signer: signer.toString(), action: Buffer.from(encode(action)).toString("hex") }
            );
        });
    }

    signTx(signer: Address, unsignedTx: UnsignedTx): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            this.handler.send(
                { resolve: (value: string) => resolve(Buffer.from(value, "hex")), reject },
                { method: 'signTx', signer: signer.toString(), utx: Buffer.from(encode(encodeUnsignedTx(unsignedTx))).toString("hex") }
            );
        });
    }

    listAccounts(): Promise<{
        address: Address,
    }[]> {
        return new Promise((resolve, reject) => {
            this.handler.send(
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
            this.handler.send(
                {
                    resolve: (value: string) => resolve(PublicKey.fromHex(value, "uncompressed")),
                    reject
                },
                { method: "getPublicKey", address: address.toString(), }
            );
        });
    }
};
