import { Address, PublicKey } from "@planetarium/account";
import { Value, encode } from "@planetarium/bencodex";
import { WindowMessageHandler } from "./handler.js";
import { Buffer } from "buffer";
import { encodeUnsignedTx, type UnsignedTx } from "@planetarium/tx";
import { EventType, EventHandler, Network } from "./event.js";
import type { PolymorphicAction } from "@planetarium/lib9c";

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

    connect(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.handler.send(
                { resolve: (x) => resolve(x), reject },
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

    sign(signer: Address, action: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            this.handler.send(
                { resolve: (value: string) => resolve(Buffer.from(value, "hex")), reject },
                { method: 'sign', signer: signer.toString(), action: action }); // No need Buffer
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
                        address: Address,
                    }[]) => resolve(value.map(x => {
                        return {
                            address: x.address
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
                    resolve: (value: string) => resolve(PublicKey.fromHex(value.slice(2), "uncompressed")), // Remove '0x' from value
                    reject
                },
                { method: "getPublicKey", address: address.toString(), }
            );
        });
    }
};
