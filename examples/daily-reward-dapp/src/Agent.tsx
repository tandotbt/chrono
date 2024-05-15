import { Buffer } from "buffer";
import { BencodexDictionary } from "@planetarium/bencodex";
import { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
	useStageTransactionMutation,
} from "./generated/graphql";
import { getChronoSdk } from "@planetarium/chrono-sdk";
import { Address } from "@planetarium/account";
import { GetAvatarsResponse, getAvatars, getTip } from "./mimir-client";

interface RefillButtonProps {
	signer: Address;
	avatarAddress: Address;
}

function uuidv4ToBuffer(uuid: string): Buffer {
	const source = Buffer.from(uuid.replace(/-/g, ""), "hex");
	const buffer = new Buffer(16);

	// Match byte-order.
	buffer[0] = source[3];
	buffer[1] = source[2];
	buffer[2] = source[1];
	buffer[3] = source[0];
	buffer[4] = source[5];
	buffer[5] = source[4];
	buffer[6] = source[7];
	buffer[7] = source[6];

	source.copy(buffer, 8, 8, 16);

	return buffer;
}

function createDailyRewardAction(avatarAddress: Address): BencodexDictionary {
	const id = uuidv4();
	return new BencodexDictionary([
		["type_id", "daily_reward7"],
		[
			"values",
			new BencodexDictionary([
				["id", uuidv4ToBuffer(id)],
				["a", avatarAddress.toBytes()],
			]),
		],
	]);
}

type RefillProgress = "None" | "Signing" | "Staging" | "Done";

function RefillButton({ signer, avatarAddress }: RefillButtonProps) {
	const [progress, setProgress] = useState<RefillProgress>("None");
	const [stage] = useStageTransactionMutation();
	const action = useMemo(() => {
		return createDailyRewardAction(avatarAddress);
	}, [avatarAddress]);

	const onClick = () => {
		setProgress("Signing");
		const chronoWallet = getChronoSdk();
		if (chronoWallet === undefined) {
			return;
		}

		chronoWallet
			.sign(signer, action)
			.then((tx) => {
				console.log(tx);
				setProgress("Staging");
				return stage({
					variables: {
						tx: tx.toString("hex"),
					},
				}).then(({ data, errors }) => {
					setProgress("Done");
					console.log(data, errors);
				});
			})
			.catch((e: unknown) => {
				console.error(e);
				setProgress("None");
			});
	};

	if (progress !== "None") {
		return (
			<button
				type="button"
				className="rounded-md bg-black text-white p-3 font-bold"
			>
				{progress}
			</button>
		);
	}

	return (
		<button
			type="button"
			className="rounded-md bg-yellow-400 text-white p-3 font-bold"
			onClick={onClick}
		>
			Refill
		</button>
	);
}

interface AgentProps {
	network: "odin" | "heimdall";
	agentAddress: Address;
}

function Agent({ network, agentAddress }: AgentProps) {
	const [agent, setAgent] = useState<GetAvatarsResponse>();
	const [tip, setTip] = useState<number>();

	useEffect(() => {
		const interval = setInterval(() => {
			getAvatars(network, agentAddress.toString()).then(setAgent);
			getTip(network).then(setTip);
		}, 1000);

		return () => clearInterval(interval);
	}, [network, agentAddress]);

	if (agent === undefined || tip === undefined) {
		return (
			<p className="mt-8 text-white">Loading or unexpected failure while fetching data.</p>
		);
	}

	if (agent.avatars.length < 1) {
		return (
			<p className="mt-8 text-white">The agent may not have any avatars.</p>
		);
	}
	const avatars = agent.avatars;
	const REFILL_INTERVAL = 2550 as const;

	return (
		<div className="flex flex-col mt-8 min-w-full min-h-full justify-center items-center">
			{avatars.map(({ avatarAddress, avatarName, actionPoint, dailyRewardReceivedIndex }) => (
				<div className="p-8 shadow-lg w-4/12 bg-slate-100" key={avatarAddress}>
					<div className="flex flex-row justify-center items-center gap-4">
						<span className="font-bold">
							{avatarName} ({actionPoint} / 120)
						</span>
						{tip - dailyRewardReceivedIndex > REFILL_INTERVAL ? (
							<RefillButton
								signer={agentAddress}
								avatarAddress={Address.fromHex(avatarAddress)}
							/>
						) : (
							<></>
						)}
					</div>
				</div>
			))}
		</div>
	);
}

export default Agent;
