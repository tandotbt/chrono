import { ChronoWallet } from "./chrono-wallet";
import { WindowMessageHandler } from "./handler";

export function setupChronoSdk() {
    const handler = new WindowMessageHandler(window);
    const chronoWallet = new ChronoWallet(handler);
    (window as any).chronoWallet = chronoWallet;
}
