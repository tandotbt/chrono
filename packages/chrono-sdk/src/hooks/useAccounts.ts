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
