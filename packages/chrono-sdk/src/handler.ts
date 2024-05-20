type Handlers = {
    resolve: (value: any) => void;
    reject: (error: unknown) => void;
};

type SubscribeHandler = (_: any) => void;

export class WindowMessageHandler {
    private messageId: number;
    private readonly eventHandlers: Map<number, Handlers>;
    private readonly subscribeHandlers: Map<string, SubscribeHandler[]>;
    private readonly window: Window;

    constructor(window: Window) {
        this.messageId = 1;
        this.eventHandlers = new Map();
        this.subscribeHandlers = new Map();
        this.window = window;

        window.addEventListener('message', this.handler.bind(this));
        window.addEventListener('message', this.subscribeHandler.bind(this));
    }

    send(handlers: Handlers, message: {
        method: string,
        [key: string]: string | string[],
    }) {
        const currentMessageId = this.messageId++;
        this.eventHandlers.set(currentMessageId, handlers);

        this.window.postMessage({
            type: 'FROM_PAGE',
            messageId: currentMessageId,
            ...message,
        }, '*');
    }

    subscribe(event: string, handler: SubscribeHandler) {
        if (!this.subscribeHandlers.get(event)) {
            this.subscribeHandlers.set(event, []);
        }
        
        const handlers = this.subscribeHandlers.get(event);
        if (!handlers)  {
            throw new Error('Unexpected state. Handlers does not exist.');
        }

        handlers.push(handler);
    }

    unsubscribe(event: string, handler: SubscribeHandler) {
        const handlers = this.subscribeHandlers.get(event);
        if (!handlers) {
            return;
        }

        this.subscribeHandlers.set(event, handlers.filter(x => x !== handler));
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

    private subscribeHandler(event: MessageEvent) {
        if (event.source != this.window)
            return;
    
        if (!event.data.type || event.data.type !== 'FROM_CHRONO') {
            return;
        }

        if (!event.data.event || !event.data.data) {
            return;
        }
    
        const handlers = this.subscribeHandlers.get(event.data.event);
        if (!handlers) {
            return;
        }

        for (const handler of handlers) {
            try {
                handler(event.data.data);
            } catch (e) {
                console.debug("Handler throws error", handler, e);
            }
        }
    }
}
