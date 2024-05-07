import Graphql from "@/api/graphql"
import Storage from "@/storage/storage"
import Wallet from "@/wallet/wallet"
import { Buffer } from "buffer";

window.Buffer = Buffer;

;(function() {
    let passphrase = null
    let passphraseTTL = 0

    const checkValidPassphrase = async (p) => {
        const storage = new Storage(p)
        try {
            let accounts = await storage.get('accounts')
            return accounts.length > 0
        } catch(e) {}
        return false
    }

    chrome.extension.onMessage.addListener((req, sender, sendResponse) => {
        console.log("req", req);
        try {
            if (req.action == 'passphrase') {
                if (req.method == 'set') {
                    passphrase = req.params[0]
                    passphraseTTL = +new Date + 3600 * 1000
                    sendResponse({})
                } else if (req.method == 'checkTTL') {
                    if (passphraseTTL && passphraseTTL < +new Date) {
                        passphrase = null
                    }
                    sendResponse({})
                } else if (req.method == 'remove') {
                    passphrase = null
                    sendResponse({})
                } else if (req.method == 'isSignedIn') {
                    checkValidPassphrase(passphrase).then(sendResponse)
                } else if (req.method == 'isValid') {
                    checkValidPassphrase(req.params[0]).then(sendResponse)
                }
            } else if (req.action == 'hasWallet') {
                const storage = new Storage(passphrase)
                storage.has('accounts').then(sendResponse)
            } else {
                if (passphrase == null) {
                    return sendResponse({error: 'NotSignedIn'})
                }

                if (req.action == 'graphql') {
                    const storage = new Storage(passphrase)
                    Graphql.createInstance(storage).then(graphql => {
                        console.log("graphql", req)
                        if (graphql[req.method] && graphql.canCallExternal(req.method)) {
                            graphql[req.method].call(graphql, ...req.params)
                                .then(sendResponse)
                                .catch(e => sendResponse({error: e}))
                        } else {
                            sendResponse({error: 'Unknown Method'})
                        }
                    });
                }

                if (req.action == 'storage') {
                    const storage = new Storage(passphrase)
                    if (storage[req.method] && storage.canCallExternal(req.method)) {
                        storage[req.method].call(storage, ...req.params)
                            .then(sendResponse)
                            .catch(e => sendResponse({error: e}))
                    } else {
                        sendResponse({error: 'Unknown Method'})
                    }
                }

                if (req.action == 'wallet') {
                    Wallet.createInstance(passphrase).then(wallet => {
                        if (wallet[req.method] && wallet.canCallExternal(req.method)) {
                            wallet[req.method].call(wallet, ...req.params)
                                .then(sendResponse)
                                .catch(e => {
                                    console.error(e);
                                    sendResponse({error: e})
                                })
                        } else {
                            sendResponse({error: 'Unknown Method'})
                        }
                    })
                }
            }
        } catch(e) {
            sendResponse(e)
        }

        return true
    });

    chrome.runtime.onConnect.addListener(function(port) {
        console.assert(port.name === "content-script");
        port.onMessage.addListener(function(req) {
            console.log(port.name, req);
            if (req.action == 'wallet') {
                Wallet.createInstance(() => passphrase, req.origin).then(wallet => {
                    wallet.isConnected().then((connected) => {
                        if (!connected && req.method !== "connect" && req.method !== "isConnected") {
                            port.postMessage({error: `${req.origin} is not connected. Call 'window.chronoWallet.connect' first.`, messageId: req.messageId});
                        }
    
                        if (wallet[req.method] && wallet.canCallExternal(req.method)) {
                            wallet[req.method].call(wallet, ...req.params)
                                .then(x => {
                                    console.log(x)
                                    port.postMessage({
                                        result: x,
                                        messageId: req.messageId,
                                    })
                                })
                                .catch(e => {
                                    console.error(e);
                                    port.postMessage({
                                        error: `${req.method} is rejected`,
                                        messageId: req.messageId
                                    })
                                })
                        } else {
                            port.postMessage({error: 'Unknown Method', messageId: req.messageId})
                        }
                    })
                })
                
            }
        });
    });
})()
