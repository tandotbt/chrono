import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { useEffect, useState } from "react";
import Agent from "./Agent";
import { getChronoSdk } from "@planetarium/chrono-sdk";
import { Address } from "@planetarium/account";

function App() {
	const client = new ApolloClient({
		uri: "https://9c-main-full-state.nine-chronicles.com/graphql",
		cache: new InMemoryCache(),
	});

	const [accounts, setAccounts] = useState<
		{
			activated: boolean;
			address: Address;
		}[]
	>([]);
	const [currentAccount, setCurrentAccount] = useState<number | null>(null);


	const chronoWallet = getChronoSdk();

	useEffect(() => {
		(async () => {
			if (chronoWallet === undefined) {
				return;
			}

			const addresses = (await chronoWallet.listAccounts()).map((x) => {
				return {
					activated: x.activated,
					address: x.address,
				};
			});
			setAccounts(addresses);
			for (let i = 0; i < addresses.length; i++) {
				if (addresses[i].activated) {
					setCurrentAccount(i);
					return;
				}
			}

			setCurrentAccount(0);
		})();
	}, [chronoWallet]);

	if (chronoWallet === undefined) {
		return <div className="flex flex-col bg-gray-900 justify-center items-center min-w-screen min-h-screen">
			There is no Chrono Wallet. You should install Chrono wallet first to use this app.
		</div> 
	}

	if (currentAccount === null) {
		return <>Loading...</>;
	}

	return (
		<ApolloProvider client={client}>
			<div className="flex flex-col bg-gray-900 justify-center items-center min-w-screen min-h-screen">
				<select
					className="select-wrapper border-[16px] border-white"
					onChange={(e) => setCurrentAccount(Number(e.target.value))}
				>
					{...accounts
						.filter((acc) => acc.activated)
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
