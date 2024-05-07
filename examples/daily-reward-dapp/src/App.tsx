import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { useEffect, useState } from "react";
import Agent from "./Agent";
import { getChronoSdk } from "@planetarium/chrono-sdk";
import { Address } from "@planetarium/account";

function App() {
	const [accounts, setAccounts] = useState<
		{
			address: Address;
		}[]
	>([]);
	const [currentAccount, setCurrentAccount] = useState<number | null>(null);
	const [isConnected, setConnected] = useState<boolean>(false);
	const [currentNetwork, setCurrentNetwork] = useState<{
		gqlEndpoint: string,
		id: string,
	} | null>(null);

	const chronoWallet = getChronoSdk();

	useEffect(() => {
		(async() => {
			if (chronoWallet === undefined) {
				return;
			}

			setConnected(await chronoWallet.isConnected());
		})();
	}, [chronoWallet]);
	useEffect(() => {
		(async () => {
			if (chronoWallet === undefined) {
				return;
			}

			try {
				const addresses = (await chronoWallet.listAccounts()).map((x) => {
					return {
						address: x.address,
					};
				});
				setAccounts(addresses);
				setCurrentAccount(0);
			} catch (e) {
				console.error(e);
			}	
		})();
	}, [chronoWallet]);
	useEffect(() => {
		(async () => {
			if (chronoWallet === undefined) {
				return;
			}

			try {
				const network = await chronoWallet.getCurrentNetwork();
				console.log(network);
				setCurrentNetwork(network);
			} catch (e) {
				console.error(e);
			}	
		})();
	}, [chronoWallet]);

	if (chronoWallet === undefined) {
		return <div className="flex flex-col bg-gray-900 justify-center items-center min-w-screen min-h-screen">
			There is no Chrono Wallet. You should install Chrono wallet first to use this app.
		</div> 
	}

	function connect() {
		chronoWallet!.connect()
	}

	if (!isConnected) {
		return <div className="flex flex-col bg-gray-900 justify-center items-center min-w-screen min-h-screen">
			<p className="text-white mb-6 text-lg font-bold">You must connect (allow) this site on Chrono first.</p>
			<button className="bg-white p-4 font-bold" onClick={connect}>Connect</button>
		</div>
	}

	if (currentAccount === null) {
		return <>Loading... (account)</>;
	}

	if (currentNetwork === null) {
		return <>Loading... (network)</>
	}

	const client = new ApolloClient({
		uri: currentNetwork.gqlEndpoint,
		cache: new InMemoryCache(),
	});

	return (
		<ApolloProvider client={client}>
			<div className="flex flex-col bg-gray-900 justify-center items-center min-w-screen min-h-screen">
				<select
					className="select-wrapper border-[16px] border-white"
					onChange={(e) => setCurrentAccount(Number(e.target.value))}
				>
					{...accounts
						.map((acc, index) => (
							<option key={acc.address.toString()} value={index}>
								{acc.address.toString()}
							</option>
						))}
				</select>
				<Agent agentAddress={accounts[currentAccount].address} />
			</div>
		</ApolloProvider>
	);
}

export default App;
