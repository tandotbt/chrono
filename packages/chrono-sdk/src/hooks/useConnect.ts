import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getChronoSdk } from "..";

export function useConnect() {
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
            await queryClient.invalidateQueries({
                queryKey: ["accounts"]
            })
        }
    });

    return {
        connect: mutate,
        connectAsync: mutateAsync,
        ...result,
    }
}
