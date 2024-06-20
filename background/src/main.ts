import Graphql from "./api/graphql";
import { Storage } from "./storage/index.js";
import Wallet from "./wallet/wallet";
import { Buffer } from "buffer";
import {
    PASSWORD_CHECKER,
    PASSWORD_CHECKER_VALUE,
} from "./constants/constants";
import { NetworkController } from "./controllers/network";
import { ConfirmationController } from "./controllers/confirmation";
import { PopupController } from "./controllers/popup";
import aes256 from "./utils/aes256";

self.Buffer = Buffer;

let passphrase: string | null = null;
let passphraseTTL = 0;
let connections: chrome.runtime.Port[] = [];

const emitter = (event: string, data: any) => {
    for (const port of connections) {
        port.postMessage({
            event,
            data,
        });
    }
};

const checkValidPassphrase = async (p: string): Promise<boolean> => {
    const storage = new Storage(p);
    try {
        const value = await storage.get<string>(PASSWORD_CHECKER);
        const decrypted = await aes256.decrypt(value, p);
        return decrypted === PASSWORD_CHECKER_VALUE;
    } catch (e) {
        return false;
    }
};

function setup() {
	chrome.runtime.onConnect.addListener(port => {
		connections.push(port);

		port.onDisconnect.addListener(() => {
			connections = connections.filter(p => p !== port);
		});

		port.onMessage.addListener(async (req) => {
			if (req.action === "wallet") {
				const storage = new Storage(() => passphrase!);
				const wallet = await Wallet.createInstance(
					storage,
					() => passphrase!,
					emitter,
					req.origin,
				);
				const connected = await wallet.isConnected();
				if (!connected && req.method !== "connect" && req.method !== "isConnected") {
					port.postMessage({
						error: `${req.origin} is not connected. Call 'window.chronoWallet.connect' first.`,
						messageId: req.messageId,
					});
				} else if (wallet[req.method] && wallet.canCallExternal(req.method)) {
					try {
						const result = await wallet[req.method](...req.params);
						port.postMessage({
							result,
							messageId: req.messageId,
						});
					} catch (e) {
						port.postMessage({
							error: `${req.method} is rejected`,
							messageId: req.messageId,
						});
					}
				} else {
					port.postMessage({
						error: "Unknown Method",
						messageId: req.messageId,
					});
				}
			}

			if (req.action === "network") {
				const storage = new Storage(() => passphrase!);
				const networkController = new NetworkController(storage, emitter);
				if (networkController[req.method]) {
					try {
						const result = await networkController[req.method](...req.params);
						port.postMessage({
							result,
							messageId: req.messageId,
						});
					} catch (e) {
						port.postMessage({
							error: `${req.method} is rejected`,
							messageId: req.messageId,
						});
					}
				} else {
					port.postMessage({
						error: "Unknown Method",
						messageId: req.messageId,
					});
				}
			}

			if (req.action === "confirmation") {
				const storage = new Storage(passphrase!);
				const popupController = new PopupController();
				const confirmationController = new ConfirmationController(
					storage,
					popupController,
				);
				if (confirmationController[req.method]) {
					try {
						const result = await confirmationController[req.method](...req.params);
						port.postMessage({
							result,
							messageId: req.messageId,
						});
					} catch (e) {
						port.postMessage({
							error: `${req.method} is rejected`,
							messageId: req.messageId,
						});
					}
				} else {
					port.postMessage({
						error: "Unknown Method",
						messageId: req.messageId,
					});
				}
			}
		});
	});
}

self.addEventListener('install', () => {
	// event.waitUntil(self.skipWaiting());
	console.log('install case');
	setup();
});

// @ts-ignore
if (self.serviceWorker.state === "activated") {
	console.log("activated case");
	setup();
};


chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    try {
        if (req.action === "passphrase") {
            if (req.method === "set") {
                passphrase = req.params[0];
                passphraseTTL = Date.now() + 3600 * 1000;
                sendResponse({});
            } else if (req.method === "checkTTL") {
                if (passphraseTTL && passphraseTTL < Date.now()) {
                    passphrase = null;
                }
                sendResponse({});
            } else if (req.method === "remove") {
                passphrase = null;
                sendResponse({});
            } else if (req.method === "isSignedIn") {
                if (passphrase === null) {
                    sendResponse(false);
                } else {
                    checkValidPassphrase(passphrase).then(sendResponse);
                }
            } else if (req.method === "isValid") {
                checkValidPassphrase(req.params[0]).then(sendResponse);
            }
        } else if (req.action === "hasWallet") {
            const storage = new Storage(passphrase!);
			storage.has("accounts").then(sendResponse);
        } else {
            if (passphrase == null) {
                return sendResponse({ error: "NotSignedIn" });
            }

            if (req.action === "graphql") {
				const storage = new Storage(passphrase);
				Graphql.createInstance(storage).then((graphql) => {
					console.log("graphql", req);
					if (graphql[req.method] && graphql.canCallExternal(req.method)) {
						graphql[req.method]
							.call(graphql, ...req.params)
							.then(sendResponse)
							.catch((e) => sendResponse({ error: e }));
					} else {
						sendResponse({ error: "Unknown Method" });
					}
				});
            }

            if (req.action === "storage") {
                const storage = new Storage(passphrase);
				if (storage[req.method] && storage.canCallExternal(req.method)) {
					storage[req.method]
						.call(storage, ...req.params)
						.then(sendResponse)
						.catch((e) => sendResponse({ error: e }));
				} else {
					sendResponse({ error: "Unknown Method" });
				}
            }

            if (req.action === "confirmation") {
                const storage = new Storage(passphrase);
                const popupController = new PopupController();
                const confirmationController = new ConfirmationController(
                    storage,
                    popupController,
                );
                if (confirmationController[req.method]) {
					confirmationController[req.method]
						.call(confirmationController, ...req.params)
						.then(sendResponse)
						.catch((e) => sendResponse({ error: e }));
				} else {
					sendResponse({ error: "Unknown Method" });
				}
            }

            if (req.action === "wallet") {
                const storage = new Storage(passphrase);
                Wallet.createInstance(storage, passphrase, emitter).then((wallet) => {
					if (wallet[req.method] && wallet.canCallExternal(req.method)) {
						wallet[req.method]
							.call(wallet, ...req.params)
							.then(sendResponse)
							.catch((e) => {
								console.error(e);
								sendResponse({ error: e });
							});
					} else {
						sendResponse({ error: "Unknown Method" });
					}
				});
            }

            if (req.action === "network") {
                const storage = new Storage(() => passphrase!);
                const networkController = new NetworkController(storage, emitter);
                if (networkController[req.method]) {
					networkController[req.method]
						.call(networkController, ...req.params)
						.then((x) =>
							sendResponse({
								result: x,
							}),
						)
						.catch((e) => {
							console.error(e);
							sendResponse({
								error: `${req.method} is rejected`,
							});
						});
				} else {
					sendResponse({
						error: "Unknown Method",
					});
				}
            }
        }
    } catch (e) {
        sendResponse({ error: e.message });
    }

	return true;
})
self.addEventListener('message', console.log);
