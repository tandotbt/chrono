import { ChronoWallet } from "./chrono-wallet.js";
import { WindowMessageHandler } from "./handler.js";

/**
 * Inject ChronoWallet on `window` global variable.
 * Expect to be used by Chrono content-scripts.
 */
export function setupChronoSdk() {
    const handler = new WindowMessageHandler(window);
    const chronoWallet = new ChronoWallet(handler);
    (window as any).chronoWallet = chronoWallet;
}

/**
 * Get ChronoWallet injected by Chrono content-scripts.
 * @returns The injected ChronoWallet instance.
 */
export function getChronoSdk(): ChronoWallet | undefined {
    return (window as any).chronoWallet;
}
