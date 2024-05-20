export type Network = {
    id: string,
    name: string,
    genesisHash: string,
    gqlEndpoint: string,
    isMainnet: boolean,
};

export type EventType = "network:changed";
export type Event = NetworkChangedEvent;

export type NetworkChangedEvent = Network;

export type EventMap = {
    "network:changed": NetworkChangedEvent,
}

export type EventHandler<T extends EventType> = (event: EventMap[T]) => void;
