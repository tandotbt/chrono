import { useQuery } from "@tanstack/react-query";
import { getAvatars } from "../mimir-client";

export function useAgent(network: string, agentAddress: string) {
	return useQuery({
		queryFn: async () => {
			return await getAvatars(network, agentAddress);
		},
		queryKey: [network, "agent", agentAddress],
		refetchInterval: 1000,
	});
}
