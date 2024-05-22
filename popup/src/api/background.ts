const callBackground = function<T>(action: string, method?: string, params: unknown | unknown[] = []): Promise<T> {
    return new Promise((resolve, reject) => {
        try {
            chrome.runtime.sendMessage({
                action,
                method,
                params:Array.isArray(params) ? params : [params]
            }, (res) => {
                if (res && typeof res === 'object' && res.hasOwnProperty('error')) {
                    if (res.error == 'NotSignedIn') {
                        location.reload()
                    } else {
                        console.log('error callBackground', action, method, params, res)
                        reject(res.error)
                    }
                } else {
                    resolve(res)
                }
            });
        } catch(e) {
            reject(e)
        }
    })
}

const callStorage = function<T>(method: string, params?: unknown[]): Promise<T> {
    return callBackground<T>('storage', method, params)
}

const callWallet = function<T>(method: string, params: unknown[] = []): Promise<T> {
    return callBackground<T>('wallet', method, params)
}

const callNetwork = function<T>(method: string, params: unknown[] = []): Promise<T> {
    return callBackground<T>('network', method, params)
}

const callConfirmation = function<T>(method: string, params: unknown[] = []): Promise<T> {
    return callBackground<T>('confirmation', method, params)
}

type ApprovalRequest = {
    id: string;
    category: "connect",
    data: {
        origin: string,
        content: string,
    }
} | {
    id: string;
    category: "sign",
    data: {
        signer: string;
        content: object;
    }
};

export default {
    graphql: <T>(method: string, params: unknown | unknown[]): Promise<T> => {
        return callBackground<T>('graphql', method, params)
    },
    setPassphrase: (passphrase: string) => {
        return callBackground<void>('passphrase', 'set', passphrase)
    },
    logout: () => {
        return callBackground<void>('passphrase', 'remove')
    },
    checkTTL: async () => {
        return callBackground('passphrase', 'checkTTL')
    },
    isSignedIn: async () => {
        return callBackground<boolean>('passphrase', 'isSignedIn')
    },
    isValidPassphrase: async (passphrase: string) => {
        return callBackground<boolean>('passphrase', 'isValid', passphrase)
    },
    hasWallet: async () => {
        return callBackground<boolean>('hasWallet')
    },
    storage: {
        set: async (name: string, value: unknown) => {
            return await callStorage('set', [name, value])
        },
        secureSet: async (name: string, value: unknown) => {
            return await callStorage('secureSet', [name, value])
        },
        get: async <T>(name: string): Promise<T> => {
            return await callStorage<T>('get', [name])
        },
        remove: async (name: string) => {
            return await callStorage<void>('remove', [name])
        },
        has: async (name: string) => {
            return await callStorage<boolean>('has', [name])
        },
        clearAll: async () => {
            return await callStorage<void>('clearAll')
        }
    },
    wallet: {
        decrypt: async (walletJson: string) => {
            return await callWallet('decrypt', [walletJson])
        },
        createSequentialWallet: async (primaryAddress: string, index: number) => {
            return await callWallet<{
                address: string,
                encryptedWallet: string,
            }>('createSequentialWallet', [primaryAddress, index])
        },
        createPrivateKeyWallet: async (privateKey: string) => {
            return await callWallet<{
                address: string,
                encryptedWallet: string,
            }>('createPrivateKeyWallet', [privateKey])
        },
        sendNCG: async (sender: string, receiver: string, amount: number, nonce: number) => {
            return await callWallet('sendNCG', [sender, receiver, amount, nonce])
        },
        nextNonce: async (address: string) => {
            return await callWallet<number>('nextNonce', [address])
        },
        getPrivateKey: async (address: string, passphrase: string) => {
            return await callWallet<string>('getPrivateKey', [address, passphrase])
        },
        getPublicKey: async (address: string) => {
            return await callWallet<string>('getPublicKey', [address])
        },
    },
    network: {
        switchNetwork: (id: string) => {
            return callNetwork<void>("switchNetwork", [id]);
        }
    },
    confirmation: {
        getApprovalRequests: async () => {
            return callConfirmation<ApprovalRequest[]>('getAll')
        },
        approveRequest: (requestId: string, ...params: unknown[]) => {
            return callConfirmation("approve", [requestId, ...params]);
        },
        rejectRequest: (requestId: string) => {
            return callConfirmation("reject", [requestId]);
        },
    }
}
