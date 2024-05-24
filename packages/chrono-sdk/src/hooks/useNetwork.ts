import { getChronoSdk } from "..";
import { useQuery } from "@tanstack/react-query";

export function useNetwork() {
    const sdk = getChronoSdk();

    const { refetch, ...result } = useQuery({
        queryFn: async () => {
            if (!sdk) throw new Error("sdk not exist");

            const isConnected = await sdk.isConnected();
            if (!isConnected) {
                return {
                    network: null,
                    isConnected: false as false,
                }
            }

            const network = await sdk.getCurrentNetwork();
            return {
                network,
                isConnected: true as true,
            };
        },
        queryKey: ['networks'],
    });

    sdk?.subscribe('connected', () => refetch());
    sdk?.subscribe('network:changed', () => refetch());

    return {
        refetch,
        ...result,
    }
}
