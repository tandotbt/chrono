import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getChronoSdk } from "../index.js";

type UseConnectMutationReturnType = ReturnType<typeof useMutation<{
    accounts: string[],
}, Error, void, unknown>>;
type UseConnectReturnType = Omit<UseConnectMutationReturnType, "mutate" | "mutateAsync"> & {
    connect: UseConnectMutationReturnType["mutate"],
    connectAsync: UseConnectMutationReturnType["mutateAsync"],
};

export function useConnect(): UseConnectReturnType {
    const queryClient = useQueryClient();
    const { mutate, mutateAsync, ...result } = useMutation({
        mutationFn: async () => {
            console.log("mutate function");
            const sdk = getChronoSdk();
            if (!sdk) {
                throw new Error()
            }

            console.log("connect");
            const accounts = await sdk.connect();
            return {
                accounts,
            }
        },
        onSuccess: async (variables) => {
            await Promise.all([queryClient.invalidateQueries({
                queryKey: ["accounts"]
            }), queryClient.invalidateQueries({
                queryKey: ["networks"]
            })])
        }
    });

    return {
        connect: mutate,
        connectAsync: mutateAsync,
        ...result,
    }
}
