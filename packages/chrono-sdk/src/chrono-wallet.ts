import { Address, PublicKey } from "@planetarium/account";
import { Value, encode } from "@planetarium/bencodex";
import { WindowMessageHandler } from "./handler.js";
import { Buffer } from "buffer";
import { encodeUnsignedTx, type UnsignedTx } from "@planetarium/tx";
import { EventType, EventHandler, Network } from "./event.js";
import type { PolymorphicAction } from "@planetarium/lib9c";

/**
 * Wrapper class for APIs that communicate with the Chrono browser extension.
 */
export class ChronoWallet {
    constructor(private readonly handler: WindowMessageHandler) {}

    /**
     * Subscribe an event with a handler for the event.
     * @param event A event to subscribe.
     * @param handler A function to handle notified event.
     */
    subscribe<T extends EventType>(event: EventType, handler: EventHandler<T>): void {
        this.handler.subscribe(event, handler);
    }

    /**
     * Unsubscribe registered event handler.
     * @param event An event to unsubscribe.
     * @param handler An event handler registered by @see subscribe.
     */
    unsubscribe<T extends EventType>(event: EventType, handler: EventHandler<T>): void {
        this.handler.unsubscribe(event, handler);
    }

    /**
     * Get selected network in Chrono browser extension.
     * @returns A promise that resolves selected network object.
     */
    getCurrentNetwork(): Promise<Network> {
        return new Promise((resolve, reject) => {
            this.handler.send(
                { resolve: (v) => resolve(v), reject },
                { method: 'getCurrentNetwork', }
            );
        });
    }

    /**
     * Switch network in a programmatic way.
     * @param networkId A network id of the network to switch.
     * @returns A promise.
     */
    switchNetwork(networkId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.handler.send(
                { resolve: () => resolve(), reject },
                { method: 'switchNetwork', networkId, }
            );
        });
    }

    /**
     * Request to connect accounts to current site.
     * @returns A promise that resolves connected accounts' addreses.
     */
    connect(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.handler.send(
                { resolve: (x) => resolve(x), reject },
                { method: 'connect', }
            );
        });
    }

    /**
     * Test this site is connected to Chrono browser extension.
     * @returns A promise that resolves a boolean value indicating whether the site is connected.
     */
    isConnected(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.handler.send(
                { resolve: (value: boolean) => resolve(value), reject },
                { method: 'isConnected', }
            );
        });
    }

    /**
     * Sign an unsigned transaction built with selected network and the given `action`, with `signer`s private key.
     * @param signer The address to sign. The address must be connected by `connect` process.
     * @param action An action used to build unsigned transaction.
     * @returns A promise that resolves Buffer instance containing the serialized result of the signed transaction.
     */
    sign(signer: Address, action: PolymorphicAction): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            this.handler.send(
                { resolve: (value: string) => resolve(Buffer.from(value, "hex")), reject },
                { method: 'sign', signer: signer.toString(), action: Buffer.from(action.serialize()).toString("hex") }
            );
        });
    }

    /**
     * Sign the given unsigned transaction with `signer`s private key.
     * @param signer The address to sign. The address must be connected by `connect` process.
     * @param unsignedTx An unsigned transaction object to sign.
     * @returns A promise that resolves Buffer instance containing the serialized result of the signed transaction.
     */
    signTx(signer: Address, unsignedTx: UnsignedTx): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            this.handler.send(
                { resolve: (value: string) => resolve(Buffer.from(value, "hex")), reject },
                { method: 'signTx', signer: signer.toString(), utx: Buffer.from(encode(encodeUnsignedTx(unsignedTx))).toString("hex") }
            );
        });
    }

    /**
     * Get connected accounts' addresses.
     * @returns A promise that resolves connected accounts' addresses.
     */
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

    /**
     * Get a `PublicKey` instance corresponding to the given `address`.
     * @param address An address of the account to get public key.
     * @returns A promise that resolves a `PublicKey` instance.
     */
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
