import { Storage } from "../../src/storage/index.js"
import { InMemoryStorageBackend } from "./backend/memory.js"
import { describe, expect, beforeEach, test } from "vitest";
import { IStorageBackend } from "../../src/storage/backend/common.js";
import fc from "fast-check";
import aes256 from "../../src/utils/aes256.js";

// TODO: Check lazy passpharse.
const passphrase = 'Storage Passphrase'

describe("Storage", () => {
    let backend!: IStorageBackend;
    let storage!: Storage;

    beforeEach(() => {
        backend = new InMemoryStorageBackend();
        storage = new Storage(passphrase, backend);
    });

    describe('secureGet', () => {
        test('should fail if the data is not secured', async () => {
            fc.assert(fc.asyncProperty(fc.string(), fc.string(), async (key, value) => {
                const v = await aes256.encrypt(JSON.stringify(value), passphrase);
                await backend.set(`${key}-no-secure`, JSON.stringify({ v: v, }))
                await backend.set(`${key}-secure-false`, JSON.stringify({ secure: false, v: v }))

                await expect(async () => await storage.secureGet(`${key}-no-secure`)).rejects.toThrowError("SecureGet has accessed to not secured data");
                await expect(async () => await storage.secureGet(`${key}-secure-false`)).rejects.toThrowError("SecureGet has accessed to not secured data");
            }));
        });

        test('should success if the data is secured', async () => {
            fc.assert(fc.asyncProperty(fc.string(), fc.string(), async (key, value) => {
                const v = await aes256.encrypt(JSON.stringify(value), passphrase);
                await backend.set(key, JSON.stringify({ secure: true, v: v, }))

                await expect(storage.secureGet(key)).resolves.toEqual(value);
            }));
        });
    });

    describe('get', () => {
        test('should fail if the data is secured', async () => {
            fc.assert(fc.asyncProperty(fc.string(), fc.string(), async (key, value) => {
                const v = await aes256.encrypt(JSON.stringify(value), passphrase);
                await backend.set(key, JSON.stringify({ secure: true, v: v }))

                await expect(async () => await storage.secureGet(key)).rejects.toThrowError("Can not access secure data");
            }));
        });

        test('should success if the data is not secured', async () => {
            fc.assert(fc.asyncProperty(fc.string(), fc.string(), async (key, value) => {
                await backend.set(key, JSON.stringify({ v: value, }));
                await expect(storage.get(key)).resolves.toEqual(value);
            }));
        });
    });

    describe('set', () => {
        test('should store non-secured data', async () => {
            fc.assert(fc.asyncProperty(fc.string(), fc.string(), async (key, value) => {
                await storage.set(key, value);

                const raw = JSON.parse(await backend.get(key));
                expect(!!raw.secure).toEqual(false);
                expect(raw.v).toEqual(value);
            }));
        });
    });

    describe('secureSet', () => {
        test('should store secured data', async () => {
            fc.assert(fc.asyncProperty(fc.string(), fc.string(), async (key, value) => {
                await storage.secureSet(key, value);

                const raw = JSON.parse(await backend.get(key));
                expect(raw.secure).toEqual(true);
                expect(raw.v).not.toEqual(value);
            }));
        });
    });
})
