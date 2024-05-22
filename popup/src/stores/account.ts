import { defineStore } from "pinia";

import bg from "@/api/background"
import { ACCOUNTS, CURRENT_ADDRESS, ENCRYPTED_WALLET, TXS } from "@/constants/constants";
import { useRouter } from "vue-router";
import _ from "underscore";
import utils from "@/utils/utils";
import { ref } from "vue";

interface Account {
	name: string;
	index: number;
	address: string;
	primary?: boolean;
    activated?: boolean;
    imported?: boolean;
}

type GraphQLTxStatus = "SUCCESS" | "FAILURE" | "STAGING" | "INCLUDED" | "INVALID";

interface SavedTransactionHistory {
	id: string;
	endpoint: string;
	status: GraphQLTxStatus | "TXUNKNOWN";
	action?: string;
	type: string;
	timestamp: number;
	signer: string;
	data: {
		sender: string;
		receiver: string;
		amount: number;
	};
}

type ApprovalRequest = {
    id: string;
    category: "connect",
    data: {
        origin: string,
        content: string,
    }
} | {
    id: string;
    category: "sign",
    data: {
        signer: string;
        content: object;
    }
}

function getAccounts(): Promise<Account[]> {
    return bg.storage.get<Account[]>(ACCOUNTS);
}

export const useAccounts = defineStore('Account', () => {
    const accounts = ref<Account[]>([]);
    const account = ref<Account | null>(null);
    const accountTxs = ref<SavedTransactionHistory[]>([]);

    const balance = ref<string>("0");
    const balanceLoading = ref<boolean>(false);

    const approvalRequests = ref<ApprovalRequest[]>([]);

    async function assertSignedIn() {
        const accounts = await getAccounts();
        if (accounts
            && accounts.length > 0
            && accounts[0].address
            && accounts[0].address.startsWith('0x')) {
            const _ = await bg.wallet.getPublicKey(accounts[0].address);
            return true
        }

        const router = useRouter();
        throw router.replace({name: 'login'});
    }
    async function getPrimaryAccount() {
        const accounts = await getAccounts()
        const found = accounts.find(a => a.primary)
        if (!found) {
            throw new Error("There is no primary account.");
        }

        return found;
    }
    async function getAccountMaxIndex() {
        const accounts = await getAccounts();
        return _.max(accounts.map(a => a.index));
    }
    async function getPrivateKey(address: string, passphrase: string) {
        return await bg.wallet.getPrivateKey(address, passphrase)
    }
    async function isValidPassphrase(passphrase: string) {
        return await bg.isValidPassphrase(passphrase)
    }
    async function setPassphrase(passphrase: string) {
        await bg.setPassphrase(passphrase)
    }
    async function initAccounts(address: string, ew: string, passphrase: string) {
        await bg.setPassphrase(passphrase)
        await bg.storage.clearAll()
        await bg.storage.set(ACCOUNTS, [{name: 'Account 1', index: 0, address, primary: true}])
        await bg.storage.secureSet(ENCRYPTED_WALLET + address.toLowerCase(), ew)

        await loadAccounts();
        await selectAccount(address);
    }
    async function createNewAccount(name: string) {
        await assertSignedIn();
        let primaryAccount = await getPrimaryAccount();
        let nextIndex = await getAccountMaxIndex() + 1
        let {address, encryptedWallet} = await bg.wallet.createSequentialWallet(primaryAccount.address, nextIndex)
        let accounts = await bg.storage.get<Account[]>(ACCOUNTS)
        accounts.push({name, index: nextIndex, address})
        await bg.storage.set(ACCOUNTS, accounts)
        await bg.storage.secureSet(ENCRYPTED_WALLET + address.toLowerCase(), encryptedWallet)

        await loadAccounts();
        await selectAccount(address);
    }
    async function deleteAccount(address: string) {
        await assertSignedIn();
        const fetchedAccounts = await getAccounts();
        const newAccounts = fetchedAccounts.filter(account => !utils.equalsHex(account.address, address))
        await bg.storage.set(ACCOUNTS, newAccounts)
        await bg.storage.remove(ENCRYPTED_WALLET + address.toLowerCase())

        await loadAccounts();
        if (account.value === null) {
            throw new Error("state.account is null.");
        }

        if (utils.equalsHex(account.value.address, address)) {
            await selectAccount(accounts.value[0].address);
        }
    }
    async function importAccount(accountName: string, privateKey: string) {
        await assertSignedIn();
        if (accountName && (privateKey.length == 64 || privateKey.length == 66)) {
            let {address, encryptedWallet} = await bg.wallet.createPrivateKeyWallet(privateKey)
            console.log('importAccount', address, encryptedWallet)
            if (address) {
                const accounts = await getAccounts();
                if (!accounts.find(a => utils.equalsHex(a.address, address))) {
                    accounts.push({name: accountName, index: 0, address: address, imported: true})
                    await bg.storage.set(ACCOUNTS, accounts)
                    await bg.storage.secureSet(ENCRYPTED_WALLET + address.toLowerCase(), encryptedWallet)
                }
                await loadAccounts();
                await selectAccount(address);
            } else {
                throw Error
            }
        } else {
            throw Error
        }
    }
    async function loadAccounts() {
        await assertSignedIn();
        const fetchedAccounts = await getAccounts();
        if (fetchedAccounts && fetchedAccounts.length > 0) {
            accounts.value = fetchedAccounts;
            let savedSelected = await bg.storage.get<string>(CURRENT_ADDRESS)
            if (savedSelected && accounts.value.find(a => utils.equalsHex(a.address, savedSelected))) {
                await selectAccount(savedSelected);
            } else {
                await selectAccount(accounts.value[0].address);
            }
        }
    }
    async function updateAccountName(address: string, name: string) {
        await assertSignedIn();
        const found = accounts.value.find(account => utils.equalsHex(account.address, address))
        if (found) {
            found.name = name
        }

        await bg.storage.set(ACCOUNTS, accounts.value)
    }
    async function checkAccountActivated(address: string) {
        const found = accounts.value.find(a => utils.equalsHex(a.address, address))
        if (found) {
            const activated = await bg.graphql<boolean>('getActivationStatus', address)
            found.activated = activated;
            account.value = found;
        }
    }
    async function refreshBalance(loading?: boolean) {
        if (loading) {
            balanceLoading.value = true;
        }

        try {
            const fetchedbalance = await bg.graphql<string>('getBalance', account.value?.address)
            balance.value = fetchedbalance;
        } catch(e) {
            console.log(e)
            balance.value = "0";
        }
        balanceLoading.value = false;
    }
    async function loadTxs() {
        const txs = (await bg.storage.get<SavedTransactionHistory[]>(TXS + account.value?.address.toLowerCase())) || []
        accountTxs.value = txs;
    }
    async function refreshStagingTxStatus() {
        if (!account.value || !account.value.address) return
        const storageKey = TXS + account.value.address.toLowerCase()
        const txs = await bg.storage.get<SavedTransactionHistory[]>(storageKey)
        let updated = false
        if (txs && txs.length > 0) {
            for (let tx of txs) {
                if (tx.status == 'STAGING') {
                    if (tx.id) {
                        const status = await bg.graphql<GraphQLTxStatus>('getTransactionStatus', {txId: tx.id, endpoint: tx.endpoint})
                        tx.status = status
                        updated = true
                    } else {
                        tx.status = 'TXUNKNOWN'
                        updated = true
                    }
                }

            }
        }

        if (updated) {
            await bg.storage.set(storageKey, txs)
            await loadTxs();
        }
    }
    async function loadApprovalRequests() {
        const fetchedApprovalRequests: ApprovalRequest[] = (await bg.confirmation.getApprovalRequests()) || [];

        approvalRequests.value = fetchedApprovalRequests;
    }
    async function selectAccount(address: string) {
        const found = accounts.value.find(a => a.address.toLowerCase() === address.toLowerCase())
        if (found) {
            account.value = found;
        }

        await bg.storage.set(CURRENT_ADDRESS, address)

        await checkAccountActivated(address);
        await refreshBalance(true);
        await loadTxs()
    }

    return {
        account,
        accountTxs,
        accounts,
        balance,
        balanceLoading,
        approvalRequests,

        refreshBalance,
        refreshStagingTxStatus,
        loadTxs,
        loadApprovalRequests,
        selectAccount,
        assertSignedIn,
        getPrimaryAccount,
        getAccountMaxIndex,
        getPrivateKey,
        isValidPassphrase,
        setPassphrase,
        initAccounts,
        createNewAccount,
        deleteAccount,
        importAccount,
        loadAccounts,
        updateAccountName,
        checkAccountActivated,
    }
})
