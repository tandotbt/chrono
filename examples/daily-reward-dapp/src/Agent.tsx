import { Buffer } from "buffer";
import { BencodexDictionary, encode } from "@planetarium/bencodex";
import { useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
	useGetAvatarsWithTipQuery,
	useStageTransactionMutation,
} from "./generated/graphql";

interface RefillButtonProps {
	signer: string;
	avatarAddress: string;
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

function createDailyRewardAction(avatarAddress: string): BencodexDictionary {
	const id = uuidv4();
	return new BencodexDictionary([
		["type_id", "daily_reward7"],
		[
			"values",
			new BencodexDictionary([
				["id", uuidv4ToBuffer(id)],
				["a", Buffer.from(avatarAddress.replace("0x", ""), "hex")],
			]),
		],
	]);
}

type RefillProgress = "None" | "Signing" | "Staging" | "Done";

function RefillButton({ signer, avatarAddress }: RefillButtonProps) {
	const [progress, setProgress] = useState<RefillProgress>("None");
	const [stage] = useStageTransactionMutation();
	const actionHex = useMemo(() => {
		const action = createDailyRewardAction(avatarAddress);
		return Buffer.from(encode(action)).toString("hex");
	}, [avatarAddress]);

	const onClick = () => {
		setProgress("Signing");
		window.chronoWallet
			.sign(signer, actionHex)
			.then((tx) => {
				console.log(tx);
				setProgress("Staging");
				return stage({
					variables: {
						tx,
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
	agentAddress: string;
}

function Agent({ agentAddress }: AgentProps) {
	const { data, loading, error } = useGetAvatarsWithTipQuery({
		variables: {
			agentAddress,
		},
		pollInterval: 500,
	});

	if (loading) {
		return <p className="mt-8 text-white">Loading</p>;
	}

	if (error) {
		return (
			<p className="mt-8 text-white">Failed to fetch agent-related states.</p>
		);
	}

	if (data === undefined) {
		return (
			<p className="mt-8 text-white">Unexpected failure while fetching data.</p>
		);
	}

	if (data.stateQuery.agent === null || data.stateQuery.agent === undefined) {
		return (
			<p className="mt-8 text-white">
				There is no such agent. (address: {agentAddress})
			</p>
		);
	}
	const agent = data.stateQuery.agent;

	if (agent.avatarStates === null || agent.avatarStates === undefined) {
		return (
			<p className="mt-8 text-white">The agent may not have avatar states.</p>
		);
	}
	const avatarStates = agent.avatarStates;
	const tipIndex = data.nodeStatus.tip.index;

	return (
		<div className="flex flex-col mt-8 min-w-full min-h-full justify-center items-center">
			{avatarStates.map((avatar) => (
				<div className="p-8 shadow-lg w-4/12 bg-slate-100" key={avatar.address}>
					<div className="flex flex-row justify-center items-center gap-4">
						<span className="font-bold">
							{avatar.name} ({avatar.actionPoint} / 120)
						</span>
						{tipIndex - avatar.dailyRewardReceivedIndex > 2550 ? (
							<RefillButton
								signer={agentAddress}
								avatarAddress={avatar.address}
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
