export type Network = {
    id: string,
    name: string,
    genesisHash: string,
    gqlEndpoint: string,
    isMainnet: boolean,
};

export type EventType = "network:changed" | "connected";
export type Event = NetworkChangedEvent;

export type NetworkChangedEvent = Network;
export type ConnectedEvent = string[];

export type EventMap = {
    "network:changed": NetworkChangedEvent,
    "connected": NetworkChangedEvent,
}

export type EventHandler<T extends EventType> = (event: EventMap[T]) => void;
