// Functions
function connect() {
	return chrome.runtime.connect({
		name: "content-script",
	})
}

function portMessagelistener(res: any, port: chrome.runtime.Port) {
	const messageId = res.messageId;

	if (res && typeof res === "object" && res.hasOwnProperty("error")) {
		window.postMessage({
			type: "FROM_CHRONO",
			messageId: messageId,
			error: res.error,
		});
	} else if (
		!messageId &&
		res &&
		typeof res === "object" &&
		res.hasOwnProperty("event") &&
		res.hasOwnProperty("data")
	) {
		window.postMessage({
			type: "FROM_CHRONO",
			event: res.event,
			data: res.data,
		});
	} else {
		window.postMessage({
			type: "FROM_CHRONO",
			messageId: messageId,
			result: res.result,
		});
	}
};

function portDisconnectlistener(port: chrome.runtime.Port) {
	port.onDisconnect.removeListener(portDisconnectlistener);
	port.onMessage.removeListener(portMessagelistener);

	port = connect();

	port.onDisconnect.addListener(portDisconnectlistener);
	port.onMessage.addListener(portMessagelistener);
};


async function windowMessageListener(event: MessageEvent) {
	if (event.source != window) return;

	if (!event.data.type || event.data.type !== "FROM_PAGE") {
		return;
	}

	const origin = event.origin;

	const messageId = event.data.messageId;
	const method = event.data.method;

	try {
		if (method === "sign") {
			port.postMessage({
				action: "wallet",
				method: "sign",
				params: [event.data.signer, event.data.action],
				messageId,
				origin,
			});
		} else if (method === "signTx") {
			port.postMessage({
				action: "wallet",
				method: "signTx",
				params: [event.data.signer, event.data.utx],
				messageId,
			});
		} else if (method === "listAccounts") {
			port.postMessage({
				action: "wallet",
				method: "listAccounts",
				params: [],
				messageId,
				origin,
			});
		} else if (method === "getPublicKey") {
			port.postMessage({
				action: "wallet",
				method: "getPublicKey",
				params: [event.data.address],
				messageId,
				origin,
			});
		} else if (method === "connect") {
			port.postMessage({
				action: "wallet",
				method: "connect",
				params: [event.data.permissions],
				messageId,
				origin,
			});
		} else if (method === "isConnected") {
			port.postMessage({
				action: "wallet",
				method: "isConnected",
				params: [event.data.permissions],
				messageId,
				origin,
			});
		} else if (method === "getCurrentNetwork") {
			port.postMessage({
				action: "network",
				method: "getCurrentNetwork",
				params: [],
				messageId,
				origin,
			});
		} else if (method === "switchNetwork") {
			port.postMessage({
				action: "network",
				method: "switchNetwork",
				params: [event.data.networkId],
				messageId,
				origin,
			});
		}
	} catch (e) {
		console.error(e);
		window.postMessage(
			{
				type: "FROM_CHRONO",
				messageId: messageId,
				error: e,
			},
			event.source.origin,
		);
	}
}

// Setup
const scriptElement = document.createElement("script");
scriptElement.src = chrome.runtime.getURL("content-scripts/global.js");

let port = connect();

port.onDisconnect.addListener(portDisconnectlistener);
port.onMessage.addListener(portMessagelistener);

window.addEventListener("message", windowMessageListener);

document.documentElement.appendChild(scriptElement).remove();
