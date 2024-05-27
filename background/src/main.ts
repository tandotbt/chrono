import Graphql from "@/api/graphql";
import Storage from "@/storage/storage";
import Wallet from "@/wallet/wallet";
import { Buffer } from "buffer";
import {
	Account,
	ENCRYPTED_WALLET,
	PASSWORD_CHECKER,
	PASSWORD_CHECKER_VALUE,
} from "./constants/constants";
import { NetworkController } from "./controllers/network";
import { ConfirmationController } from "./controllers/confirmation";
import { PopupController } from "./controllers/popup";
import aes256 from "./utils/aes256";

window.Buffer = Buffer;
(function () {
	let passphrase = null;
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

	const checkValidPassphrase = async (p) => {
		const storage = new Storage(p);
		try {
			const value = await storage.get<string>(PASSWORD_CHECKER);
			const decrypted = await aes256.decrypt(value, p);
			return decrypted === PASSWORD_CHECKER_VALUE;
		} catch (e) {}
		return false;
	};

	chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
		console.log("req", req);
		try {
			if (req.action == "passphrase") {
				if (req.method == "set") {
					passphrase = req.params[0];
					passphraseTTL = +new Date() + 3600 * 1000;
					sendResponse({});
				} else if (req.method == "checkTTL") {
					if (passphraseTTL && passphraseTTL < +new Date()) {
						passphrase = null;
					}
					sendResponse({});
				} else if (req.method == "remove") {
					passphrase = null;
					sendResponse({});
				} else if (req.method == "isSignedIn") {
					if (passphrase === null) {
						console.log("return isSignedIn", false);
						sendResponse(false);
					} else {
						console.log("return isSignedIn", true);
						sendResponse(true);
					}
					checkValidPassphrase(passphrase).then(sendResponse);
				} else if (req.method == "isValid") {
					checkValidPassphrase(req.params[0]).then(sendResponse);
				}
			} else if (req.action == "hasWallet") {
				const storage = new Storage(passphrase);
				storage.has("accounts").then(sendResponse);
			} else {
				if (passphrase == null) {
					return sendResponse({ error: "NotSignedIn" });
				}

				if (req.action == "graphql") {
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

				if (req.action == "storage") {
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

				if (req.action == "confirmation") {
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

				if (req.action == "wallet") {
					Wallet.createInstance(passphrase, emitter).then((wallet) => {
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

				if (req.action == "network") {
					const storage = new Storage(() => passphrase);
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
			sendResponse(e);
		}

		return true;
	});

	chrome.runtime.onConnect.addListener(function (port) {
		console.assert(port.name === "content-script");

		connections.push(port);
		port.onDisconnect.addListener(function (port) {
			connections = connections.filter((p) => p !== port);
		});

		port.onMessage.addListener(function (req) {
			console.log(port.name, req);
			if (req.action == "wallet") {
				Wallet.createInstance(() => passphrase, emitter, req.origin).then(
					(wallet) => {
						wallet.isConnected().then((connected) => {
							if (
								!connected &&
								req.method !== "connect" &&
								req.method !== "isConnected"
							) {
								port.postMessage({
									error: `${req.origin} is not connected. Call 'window.chronoWallet.connect' first.`,
									messageId: req.messageId,
								});
							}

							if (wallet[req.method] && wallet.canCallExternal(req.method)) {
								wallet[req.method]
									.call(wallet, ...req.params)
									.then((x) => {
										console.log(x);
										port.postMessage({
											result: x,
											messageId: req.messageId,
										});
									})
									.catch((e) => {
										console.error(e);
										port.postMessage({
											error: `${req.method} is rejected`,
											messageId: req.messageId,
										});
									});
							} else {
								port.postMessage({
									error: "Unknown Method",
									messageId: req.messageId,
								});
							}
						});
					},
				);
			}

			if (req.action == "network") {
				const storage = new Storage(() => passphrase);
				const networkController = new NetworkController(storage, emitter);
				if (networkController[req.method]) {
					networkController[req.method]
						.call(networkController, ...req.params)
						.then((x) =>
							port.postMessage({
								result: x,
								messageId: req.messageId,
							}),
						)
						.catch((e) => {
							console.error(e);
							port.postMessage({
								error: `${req.method} is rejected`,
								messageId: req.messageId,
							});
						});
				} else {
					port.postMessage({
						error: "Unknown Method",
						messageId: req.messageId,
					});
				}
			}

			if (req.action == "confirmation") {
				const storage = new Storage(passphrase);
				const popupController = new PopupController();
				const confirmationController = new ConfirmationController(
					storage,
					popupController,
				);
				if (confirmationController[req.method]) {
					confirmationController[req.method]
						.call(confirmationController, ...req.params)
						.then((x) =>
							port.postMessage({
								result: x,
								messageId: req.messageId,
							}),
						)
						.catch((e) => {
							console.error(e);
							port.postMessage({
								error: `${req.method} is rejected`,
								messageId: req.messageId,
							});
						});
				} else {
					port.postMessage({
						error: "Unknown Method",
						messageId: req.messageId,
					});
				}
			}
		});
	});
})();
