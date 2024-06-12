import type { Address } from "@planetarium/account";
import { getChronoSdk } from "../index.js";
import { useQuery } from "@tanstack/react-query";

type UseAccountsReturnType = ReturnType<typeof useQuery<{
    accounts: Address[],
    isConnected: true,
} | {
    accounts: never[],
    isConnected: false,
}>>;

/**
 * A hook to get accounts from Chrono browser extension with @tanstack/react-query.
 * @example Show accounts
 * ```tsx
 * import { useAccounts } from '@planetarium/chrono-sdk/hooks';
 * 
 * function App() {
 *   const { isLoading, isSuccess, data, error } = useAccounts();
 *   
 *   if (isLoading) {
 *      return <p>Loading accounts...</p>
 *   }
 *   
 *   if (!isSuccess) {
 *      return <p>Failed to get accounts: {error}</p>
 *   }
 *   
 *   const { accounts, isConnected } = data;
 *   
 *   if (!isConnected) {
 *      // Show connect button.
 *   }
 *   
 *   return (<div>
 *     {accounts.map(x => <p key={x.toString()}>{x.toString()}</p>)}
 *   </div>)
 * }
 * ```
 */
export function useAccounts(): UseAccountsReturnType {
    const sdk = getChronoSdk();

    const { refetch, ...result } = useQuery({
        queryFn: async () => {
            if (!sdk) throw new Error("sdk not exist");

            const isConnected = await sdk.isConnected();
            if (!isConnected) {
                return {
                    accounts: [],
                    isConnected,
                }
            }

            const accounts = await sdk.listAccounts();
            return {
                accounts: accounts.map(({ address }) => address),
                isConnected,
            };
        },
        refetchOnMount: true,
        queryKey: ['accounts'],
    });

    sdk?.subscribe('connected', () => refetch);

    return {
        refetch,
        ...result,
    }
}
