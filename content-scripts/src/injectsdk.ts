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
            window.postMessage({ type: 'FROM_PAGE', signer, action, messageId: currentMessageId, }, '*');
        });
    }
};
`;

window.addEventListener('message', async function(event) {
    if (event.source != window)
        return;

    if (!event.data.type || event.data.type !== 'FROM_PAGE') {
        return;
    }

    const target = event.source.origin;
    const messageId = event.data.messageId;

    try {
        chrome.runtime.sendMessage({
            action: 'wallet',
            method: 'sign',
            params: [event.data.signer, event.data.action]
        }, res => {
            if (res && typeof res === 'object' && res.hasOwnProperty('error')) {
                window.postMessage({
                    type: "FROM_CHRONO",
                    messageId: messageId,
                    error: res.error,
                }, target);
            } else {
                window.postMessage({
                    type: "FROM_CHRONO",
                    messageId: messageId,
                    result: res,
                }, target);
            }
        });
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
