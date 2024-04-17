---
outline: deep
---

# Wallet API (i.e., `window.chronoWallet`)

This page describes the specifications and issues of the Chrono Wallet API.

Chrono Wallet communicates with browser extensions through a global variable called `window.chronoWallet` to provide an interface to do things like signing. This is similar to how MetaMask provides a JSON-RPC API through `window.ethereum`.

## `listAccounts`

### Signature

```typescript
function listAccounts(): Promise<{
    activated: boolean;
    address: string;
}[]>;
```

### Parameters

There is no parameter.

### Returns

It returns an array of objects. Each object has `activated` and `address` properties.

### Examples

```typescript
const accounts = await window.chronoWallet.listAccounts();
const addresses = accounts.map(x => x.address);
```

## `getPublicKey`

### Signature

```typescript
function getPublicKey(address: string): Promise<string>;
```

### Parameters

- `address`: A hexadecimal string. The content must be an address of a public key to get, compatible for [ERC-55](https://eips.ethereum.org/EIPS/eip-55).

### Returns

It returns a hexadecimal string, public key.

### Examples

```typescript
import { PublicKey } from "@planetarium/account";

const publicKey = PublicKey.fromHex(await window.chronoWallet.getPublicKey("0x2cBaDf26574756119cF705289C33710F27443767"), "uncompressed");
```

## `sign`

Sign a new transaction with an action. If you want to configure properties like `nonce`, `timestamp`, you should use [`window.chronoWallet.signTx`](#window-chronowallet-signtx)

### Signature

```typescript
function sign(signer: string, action: string): Promise<string>;
```

### Parameters

- `signer`: A hexadecimal string. The content must be the signer's address compatible for [ERC-55](https://eips.ethereum.org/EIPS/eip-55).
- `action`: A hexadecimal string. The content should be encoded action.

### Returns

It returns a hexadecimal string, encoded signed transaction.

### Examples

```typescript
import { encode, BencodexDictionary } from "@planetarium/bencodex";
import { Buffer } from "buffer";

const signer = "0x2cBaDf26574756119cF705289C33710F27443767";
const action = new BencodexDictionary([
    ["type_id", "daily_reward7"],
    ["values", new BencodexDictionary([
        ["a", Buffer.from("DE3873DB166647Cc3538ef64EAA8A0cCFD51B9fE", "hex")]
    ])]
]);
const actionHex = Buffer.from(encode(action)).toString(hex);

const signedTxHex = await window.chronoWallet.sign(signer, actionHex);
```

## `signTx`

### Signature

```typescript
function signTx(signer: string, unsignedTx: string): Promise<string>;
```

### Parameters

- `signer`: A hexadecimal string. The content must be the signer's address compatible for [ERC-55](https://eips.ethereum.org/EIPS/eip-55).
- `unsignedTx`: A hexadecimal string. The content should be encoded unsigned transaction.

### Returns

It returns a hexadecimal string, encoded signed transaction.

### Examples

```typescript
import { type UnsignedTx, encodeUnsignedTx } from "@planetarium/tx";
import { Address } from "@planetarium/account";
import { encode, BencodexDictionary } from "@planetarium/bencodex";
import { Buffer } from "buffer";
import { Decimal } from "decimal.js";

const signer = Address.fromHex("0x2cBaDf26574756119cF705289C33710F27443767");
const publicKey = PublicKey.fromHex(await window.chronoWallet.getPublicKey(signer.toString()), "uncompressed");
const action = new BencodexDictionary([
    ["type_id", "daily_reward7"],
    ["values", new BencodexDictionary([
        ["a", Buffer.from("DE3873DB166647Cc3538ef64EAA8A0cCFD51B9fE", "hex")]
    ])]
]);
const actionHex = Buffer.from(encode(action)).toString(hex);

const unsignedTx = {
    signer: signer.toBytes(),
    actions: [action],
    updatedAddresses: new Set([]),
    nonce: 1n,
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

const unsignedTxHex = Buffer.from(encode(encodeUnsignedTx(unsignedTx))).toString("hex");

const signedTxHex = await window.chronoWallet.sign(signer.toString(), unsignedTxHex);
```
