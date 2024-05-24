import { ChronoWallet } from "./chrono-wallet.js";
import { WindowMessageHandler } from "./handler.js";

export function setupChronoSdk() {
    const handler = new WindowMessageHandler(window);
    const chronoWallet = new ChronoWallet(handler);
    (window as any).chronoWallet = chronoWallet;
}

export function getChronoSdk(): ChronoWallet | undefined {
    return (window as any).chronoWallet;
}
