const scriptElement = document.createElement("script");
scriptElement.textContent = `
const eventHandlers = {};
let messageId = 1;
window.addEventListener('message', function(event) {
    if (event.source != window)
        return;

    if (!event.data.type || event.data.type !== 'FROM_CHRONO') {
        return;
    }

    if (!event.data.messageId || !eventHandlers[event.data.messageId]) {
        return;
    }

    const { resolve, reject } = eventHandlers[event.data.messageId];
    if (event.data.error) {
        reject(event.data.error);
    } else {
        resolve(event.data.result);
    }

    delete eventHandlers[event.data.messageId];
});

window.chronoWallet = {
    sign(signer, action) {
        return new Promise((resolve, reject) => {
            const currentMessageId = messageId++;
            eventHandlers[currentMessageId] = { resolve, reject };
            window.postMessage({ type: 'FROM_PAGE', method: 'sign', signer, action, messageId: currentMessageId, }, '*');
        });
    },
    listAccounts() {
        return new Promise((resolve, reject) => {
            const currentMessageId = messageId++;
            eventHandlers[currentMessageId] = { resolve, reject };
            window.postMessage({ type: 'FROM_PAGE', method: 'listAccounts', messageId: currentMessageId, }, '*');
        });
    }
};
`;

const port = chrome.runtime.connect({
    name: "content-script"
});

port.onMessage.addListener((res, _) => {
    const messageId = res.messageId;

    if (res && typeof res === 'object' && res.hasOwnProperty('error')) {
        window.postMessage({
            type: "FROM_CHRONO",
            messageId: messageId,
            error: res.error,
        });
    } else {
        window.postMessage({
            type: "FROM_CHRONO",
            messageId: messageId,
            result: res.result,
        });
    }
})

window.addEventListener('message', async function(event) {
    if (event.source != window)
        return;

    if (!event.data.type || event.data.type !== 'FROM_PAGE') {
        return;
    }

    const messageId = event.data.messageId;
    const method = event.data.method;

    try {
        if (method === "sign") {
            port.postMessage({
                action: 'wallet',
                method: 'sign',
                params: [event.data.signer, event.data.action],
                messageId,
            });
        } else if (method === "listAccounts") {
            port.postMessage({
                action: 'wallet',
                method: 'listAccounts',
                params: [],
                messageId,
            });
        }
    } catch(e) {
        console.error(e);
        window.postMessage({
            type: "FROM_CHRONO",
            messageId: messageId,
            error: e,
        }, event.source.origin);
    }
});
document.documentElement.appendChild(scriptElement).remove();
