import { Address, PublicKey } from "@planetarium/account";
import { Value, encode } from "@planetarium/bencodex";
import { WindowMessageHandler } from "./handler";
import { Buffer } from "buffer";

export class ChronoWallet {
    constructor(private readonly handler: WindowMessageHandler) {}

    sign(signer: Address, action: Value): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            this.handler.addEventListener(
                { resolve: (value: string) => resolve(Buffer.from(value, "hex")), reject },
                { method: 'sign', signer: signer.toString(), action: Buffer.from(encode(action)).toString("hex") }
            );
        });
    }

    listAccounts(): Promise<{
        address: Address,
        activated: boolean,
    }[]> {
        return new Promise((resolve, reject) => {
            this.handler.addEventListener(
                {
                    resolve: (value: {
                        activated: boolean,
                        address: string,
                    }[]) => resolve(value.map(x => {
                        return {
                            activated: x.activated,
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
