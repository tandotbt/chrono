interface Window {
	chronoWallet: {
		sign(signer: string, action: string): Promise<string>;
		signTx(signer: string, unsignedTx: string): Promise<string>;
		listAccounts(): Promise<
			{
				activated: boolean;
				address: string;
			}[]
		>;
		getPublicKey(address: string): Promise<stirng>;
	};
}
