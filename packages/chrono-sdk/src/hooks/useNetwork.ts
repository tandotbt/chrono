import { Network } from "../event.js";
import { getChronoSdk } from "../index.js";
import { useQuery } from "@tanstack/react-query";

type UseNetworkReturnType = ReturnType<typeof useQuery<{
    network: null,
    isConnected: false
} | {
    network: Network,
    isConnected: true,
}>>;

/**
 * A hook to get current network from Chrono browser extension with @tanstack/react-query.
 * @example Show current network
 * ```tsx
 * import { useNetwork } from '@planetarium/chrono-sdk/hooks';
 * 
 * function App() {
 *   const { isLoading, isSuccess, data } = useNetwork();
 *   
 *   if (isLoading) {
 *     return <p>Loading network...</p>
 *   }
 * 
 *   if (!isSuccess) {
 *     return <p>Failed to fetch network.</p>
 *   }
 * 
 *   const { network, isConnected } = data;
 *   if (!isConnected) {
 *     return <p>Not Connected.</p>
 *   }
 * 
 *   return <p>{network}</p>
 * }
 * ```
 */
export function useNetwork(): UseNetworkReturnType {
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
