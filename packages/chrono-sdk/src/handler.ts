type Handlers = {
    resolve: (value: any) => void;
    reject: (error: unknown) => void;
};

export class WindowMessageHandler {
    private messageId: number;
    private readonly eventHandlers: Map<number, Handlers>;
    private readonly window: Window;

    constructor(window: Window) {
        this.messageId = 1;
        this.eventHandlers = new Map();
        this.window = window;

        window.addEventListener('message', this.handler);
    }

    addEventListener(handlers: Handlers, message: {
        method: string,
        [key: string]: string,
    }) {
        const currentMessageId = this.messageId++;
        this.eventHandlers.set(currentMessageId, handlers);

        this.window.postMessage({
            type: 'FROM_PAGE',
            messageId: currentMessageId,
            ...message,
        }, '*');
    }

    private handler(event: MessageEvent) {
        if (event.source != this.window)
            return;
    
        if (!event.data.type || event.data.type !== 'FROM_CHRONO') {
            return;
        }
    
        const handlers = this.eventHandlers.get(event.data.messageId);
        if (!event.data.messageId || !handlers) {
            return;
        }
    
        const { resolve, reject } = handlers;
        if (event.data.error) {
            reject(event.data.error);
        } else {
            resolve(event.data.result);
        }
    
        this.eventHandlers.delete(event.data.messageId);
    }
}
