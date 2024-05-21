import aes256 from "@/utils/aes256"
import { Lazyable, resolve } from "@/utils/lazy"

class Storage {
    private readonly passphrase: Lazyable<string>;
    private readonly canCall: string[];

    constructor(passphrase: Lazyable<string>) {
        this.passphrase = passphrase
        this.canCall = ['set', 'get', 'remove', 'has', 'secureSet', 'clearAll'] as const;
    }
    canCallExternal(method: string): boolean {
        return this.canCall.indexOf(method) >= 0
    }

    async rawSet<T>(name: string, value: T): Promise<void> {
        await chrome.storage.local.set({[name]: value})
    }
    rawGet<T>(name: string): Promise<T | null> {
        return new Promise(resolve => {
            chrome.storage.local.get([name], (res) => {
                resolve(res && res[name] || null)
            })
        })
    }

    /*
    Data stored through 'secureSet' can only be accessed by 'secureGet' not 'get'.
    secureSet can be accessed externally.
    However, secureGet cannot be accessed from outside and can only be accessed in the background project.

    By separating the logic, signing tasks through wallet are executed only
    in the background context, and only the results are returned.
    */
    async secureSet<T>(name: string, value: T): Promise<void> {
        const _value = JSON.stringify(
            {
                v: await aes256.encrypt(JSON.stringify(value), resolve(this.passphrase)),
                secure: true
            });
        await this.rawSet(name,  _value)
    }
    async secureGet<T>(name: string): Promise<T | null> {
        const _value = await this.rawGet<string>(name)
        if (_value) {
            const v = JSON.parse(_value);
            if (!v.secure) {
                throw 'SecureGet has accessed to not secured data'
            }
            return JSON.parse(await aes256.decrypt(v.v, resolve(this.passphrase)));
        }

        return null
    }
    async set<T>(name: string, value: T) {
        const _value = JSON.stringify({v:value});
        await this.rawSet(name,  _value)
    }
    async get<T>(name: string): Promise<T> {
        const _value = await this.rawGet<string>(name)
        if (_value) {
            const v = JSON.parse(_value)
            if (v.secure) {
                throw 'Can not access secure data'
            }

            return v.v
        }

        return null
    }
    async remove(name: string): Promise<void> {
        await chrome.storage.local.remove(name)
    }
    async has(name): Promise<boolean> {
        return (await this.rawGet(name)) !== null
    }
    async clearAll(): Promise<void> {
        await chrome.storage.local.clear()
    }
}
export default Storage