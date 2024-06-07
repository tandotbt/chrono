import Graphql from "@/api/graphql";
import { Storage } from "@/storage/index.js";
import Wallet from "@/wallet/wallet";
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

self.addEventListener('install', () => {
	// @ts-ignore
	event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
	console.log('activated', event)
	// @ts-ignore
	event.waitUntil(self.clients.claim());
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
});

self.addEventListener('message', async (event: MessageEvent) => {
    const req = event.data;
    const sender = event.source as MessagePort;

    const sendResponse = (response: any) => {
        sender.postMessage(response);
    };

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
                    const valid = await checkValidPassphrase(passphrase);
                    sendResponse(valid);
                }
            } else if (req.method === "isValid") {
                const valid = await checkValidPassphrase(req.params[0]);
                sendResponse(valid);
            }
        } else if (req.action === "hasWallet") {
            const storage = new Storage(passphrase!);
            const hasWallet = await storage.has("accounts");
            sendResponse(hasWallet);
        } else {
            if (passphrase == null) {
                return sendResponse({ error: "NotSignedIn" });
            }

            if (req.action === "graphql") {
                const storage = new Storage(passphrase);
                const graphql = await Graphql.createInstance(storage);
                if (graphql[req.method] && graphql.canCallExternal(req.method)) {
                    try {
                        const result = await graphql[req.method](...req.params);
                        sendResponse(result);
                    } catch (e) {
                        sendResponse({ error: e });
                    }
                } else {
                    sendResponse({ error: "Unknown Method" });
                }
            }

            if (req.action === "storage") {
                const storage = new Storage(passphrase);
                if (storage[req.method] && storage.canCallExternal(req.method)) {
                    try {
                        const result = await storage[req.method](...req.params);
                        sendResponse(result);
                    } catch (e) {
                        sendResponse({ error: e });
                    }
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
                    try {
                        const result = await confirmationController[req.method](...req.params);
                        sendResponse(result);
                    } catch (e) {
                        sendResponse({ error: e });
                    }
                } else {
                    sendResponse({ error: "Unknown Method" });
                }
            }

            if (req.action === "wallet") {
                const storage = new Storage(passphrase);
                const wallet = await Wallet.createInstance(storage, passphrase, emitter);
                if (wallet[req.method] && wallet.canCallExternal(req.method)) {
                    try {
                        const result = await wallet[req.method](...req.params);
                        sendResponse(result);
                    } catch (e) {
                        sendResponse({ error: e });
                    }
                } else {
                    sendResponse({ error: "Unknown Method" });
                }
            }

            if (req.action === "network") {
                const storage = new Storage(() => passphrase!);
                const networkController = new NetworkController(storage, emitter);
                if (networkController[req.method]) {
                    try {
                        const result = await networkController[req.method](...req.params);
                        sendResponse({ result });
                    } catch (e) {
                        sendResponse({ error: `${req.method} is rejected` });
                    }
                } else {
                    sendResponse({ error: "Unknown Method" });
                }
            }
        }
    } catch (e) {
        sendResponse({ error: e.message });
    }
});
