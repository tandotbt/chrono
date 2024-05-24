import { useQuery } from "@tanstack/react-query";
import { getTip } from "../mimir-client";

export function useTip(network: string) {
    return useQuery({
        queryFn: async () => {
            return await getTip(network);
        },
        queryKey: [network, "tip"],
        refetchInterval: 1000,
    })
}
