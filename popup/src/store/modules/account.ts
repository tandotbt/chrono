import {
    ACCOUNTS,
    ENCRYPTED_WALLET,
    PASSPHRASE,
    CURRENT_ADDRESS, TXS
} from "@/constants/constants";
import utils from "@/utils/utils"
import bg from "@/api/background"
import _ from 'underscore';
import type { Router } from "vue-router";

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

interface ApprovalRequest {
	id: string;
	category: string;
	data: unknown;
}

interface State {
    accounts: Account[],
    account: Account | null,
    accountTxs: SavedTransactionHistory[],

    balance: number,
    balanceLoading: boolean,

    approvalRequests: ApprovalRequest[],
}

interface ActionHandlers {
    state: State,
    commit: (name: string, args: unknown) => {},
    dispatch: <T>(name: string, args?: unknown, options?: {
        root?: boolean,
    }) => Promise<T>
}

export default {
    namespaced: true,
    state() {
        return {
            accounts: [],
            account: null,
            accountTxs: [],

            balance: 0,
            balanceLoading: false,

            approvalRequests: [],
        }
    },
    getters: {
        accounts: (state: State) => state.accounts,
        account: (state: State) => state.account,
        accountTxs: (state: State) => state.accountTxs,
        balance: (state: State) => state.balance,
        balanceLoading: (state: State) => state.balanceLoading,
        approvalRequests: (state: State) => state.approvalRequests,
    },
    mutations: {
        setAccounts(state: State, accounts: Account[]) {
            state.accounts = accounts
        },
        setAccountName(state: State, {address, name}: {address: string, name: string}) {
            let found = state.accounts.find(account => utils.equalsHex(account.address, address))
            if (found) {
                console.log('found', found)
                found.name = name
            }
        },
        selectAccount(state: State, address: string) {
            let found = state.accounts.find(a => utils.equalsHex(a.address, address))
            if (found) {
                state.account = found
            }
        },
        setAccountActivated(state: State, {address, activated}: {address: string, activated: boolean}) {
            let found = state.accounts.find(a => utils.equalsHex(a.address, address))
            if (found) {
                console.log('activated', found, address, activated)
                found.activated = activated
            }
        },
        setAccountTxs(state: State, txs: SavedTransactionHistory[]) {
            state.accountTxs = txs
        },
        setBalance(state: State, balance: number) {
            state.balance = balance
        },
        setBalanceLoading(state: State, loading: boolean) {
            state.balanceLoading = loading
        },
        setApprovalRequests(state: State, approvalRequests: ApprovalRequest[]) {
            state.approvalRequests = approvalRequests
        },
    },
    actions: {
        async assertSignedIn({state, commit, dispatch}: ActionHandlers) {
            let accounts = await bg.storage.get<Account[]>(ACCOUNTS)
            if (accounts
                && accounts.length > 0
                && accounts[0].address
                && accounts[0].address.startsWith('0x')) {
                return true
            }

            // @ts-ignore
            const router = this.$router as Router;

            throw router.replace({name: 'login'})
        },
        async getPrimaryAccount() {
            let accounts = await bg.storage.get<Account[]>(ACCOUNTS)
            return accounts.find(a => a.primary)
        },
        async getAccountMaxIndex() {
            let accounts = await bg.storage.get<Account[]>(ACCOUNTS)
            return _.max(accounts.map(a => a.index))
        },
        async getPrivateKey({state}: ActionHandlers, {address, passphrase}: {address: string, passphrase: string}) {
            return await bg.wallet.getPrivateKey(address, passphrase)
        },
        async isValidPassphrase({state}: ActionHandlers, passphrase: string) {
            return await bg.isValidPassphrase(passphrase)
        },
        async setPassphrase({state}: ActionHandlers, passphrase: string) {
            await bg.setPassphrase(passphrase)
        },
        async initAccounts({state, commit, dispatch}: ActionHandlers, {address, ew, passphrase}: {address: string, ew: string, passphrase: string}) {
            await bg.setPassphrase(passphrase)
            await bg.storage.clearAll()
            await bg.storage.set(ACCOUNTS, [{name: 'Account 1', index: 0, address, primary: true}])
            await bg.storage.secureSet(ENCRYPTED_WALLET + address.toLowerCase(), ew)

            await dispatch('loadAccounts')
            await dispatch('selectAccount', address)
        },
        async createNewAccount({state, commit, dispatch}: ActionHandlers, name: string) {
            await dispatch('assertSignedIn')
            let primaryAccount = await dispatch<Account>('getPrimaryAccount')
            let nextIndex = await dispatch<number>('getAccountMaxIndex') + 1
            let {address, encryptedWallet} = await bg.wallet.createSequentialWallet(primaryAccount.address, nextIndex)
            let accounts = await bg.storage.get<Account[]>(ACCOUNTS)
            accounts.push({name, index: nextIndex, address})
            await bg.storage.set(ACCOUNTS, accounts)
            await bg.storage.secureSet(ENCRYPTED_WALLET + address.toLowerCase(), encryptedWallet)

            await dispatch('loadAccounts')
            await dispatch('selectAccount', address)
        },
        async deleteAccount({state, commit, dispatch}: ActionHandlers, address: string) {
            await dispatch('assertSignedIn')
            let accounts = await bg.storage.get<Account[]>(ACCOUNTS)
            let newAccounts = accounts.filter(account => !utils.equalsHex(account.address, address))
            await bg.storage.set(ACCOUNTS, newAccounts)
            await bg.storage.remove(ENCRYPTED_WALLET + address.toLowerCase())

            await dispatch('loadAccounts')
            if (state.account === null) {
                throw new Error("state.account is null.");
            }

            if (utils.equalsHex(state.account.address, address)) {
                await dispatch('selectAccount', state.accounts[0].address)
            }
        },
        async importAccount({state, commit, dispatch}: ActionHandlers, {accountName, privateKey}: {accountName: string, privateKey: string}) {
            await dispatch('assertSignedIn')
            if (accountName && (privateKey.length == 64 || privateKey.length == 66)) {
                let {address, encryptedWallet} = await bg.wallet.createPrivateKeyWallet(privateKey)
                console.log('importAccount', address, encryptedWallet)
                if (address) {
                    let accounts = await bg.storage.get<Account[]>(ACCOUNTS)
                    if (!accounts.find(a => utils.equalsHex(a.address, address))) {
                        accounts.push({name: accountName, index: 0, address: address, imported: true})
                        await bg.storage.set(ACCOUNTS, accounts)
                        await bg.storage.secureSet(ENCRYPTED_WALLET + address.toLowerCase(), encryptedWallet)
                    }
                    await dispatch('loadAccounts')
                    await dispatch('selectAccount', address)
                } else {
                    throw Error
                }
            } else {
                throw Error
            }
        },
        async loadAccounts({state, commit, dispatch}: ActionHandlers) {
            await dispatch('assertSignedIn')
            let accounts = await bg.storage.get<Account[]>(ACCOUNTS)
            if (accounts && accounts.length > 0) {
                commit('setAccounts', accounts)
                let savedSelected = await bg.storage.get<string>(CURRENT_ADDRESS)
                if (savedSelected && state.accounts.find(a => utils.equalsHex(a.address, savedSelected))) {
                    dispatch('selectAccount', savedSelected)
                } else {
                    dispatch('selectAccount', state.accounts[0].address)
                }
            }

            console.log(this.loadAccounts);
        },
        async selectAccount({commit, dispatch}: ActionHandlers, address: string) {
            await bg.storage.set(CURRENT_ADDRESS, address)
            commit('selectAccount', address)
            dispatch('checkAccountActivated', {address})
            dispatch('refreshBalance', {loading: true})
            dispatch('loadTxs')
        },
        async updateAccountName({state, commit, dispatch}: ActionHandlers, {address, name}: {address: string, name: string}) {
            await dispatch('assertSignedIn')
            commit('setAccountName', {address, name})
            await bg.storage.set(ACCOUNTS, state.accounts)
        },
        async checkAccountActivated({state, commit}: ActionHandlers, {address}: {address: string}) {
            let found = state.accounts.find(a => utils.equalsHex(a.address, address))
            console.log("checkAccountActivated", address);
            if (found) {
                console.log("checkAccountActivated found", found);
                let activated = await bg.graphql('getActivationStatus', address)
                console.log('act', activated)
                commit('setAccountActivated', {address, activated})
                commit('selectAccount', address)
            }
        },
        async refreshBalance({state, commit}: ActionHandlers, {loading}: {loading?: boolean} = {}) {
            if (loading) {
                commit('setBalanceLoading', true)
            }

            try {
                let balance = await bg.graphql('getBalance', state.account?.address)
                commit('setBalance', balance)
            } catch(e) {
                console.log(e)
                commit('setBalance', 0)
            }
            commit('setBalanceLoading', false)
        },
        async loadTxs({state, commit}: ActionHandlers) {
            let txs = await bg.storage.get(TXS + state.account?.address.toLowerCase())
            if (!txs) {
                txs = []
            }
            commit('setAccountTxs', txs)
        },
        async refreshStagingTxStatus({state, dispatch}: ActionHandlers) {
            if (!state.account || !state.account.address) return
            let storageKey = TXS + state.account.address.toLowerCase()
            console.log(storageKey)
            let txs = await bg.storage.get<SavedTransactionHistory[]>(storageKey)
            console.log(txs)
            let updated = false
            if (txs && txs.length > 0) {
                for (let tx of txs) {
                    if (tx.status == 'STAGING') {
                        if (tx.id) {
                            let status = await bg.graphql<GraphQLTxStatus>('getTransactionStatus', {txId: tx.id, endpoint: tx.endpoint})
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
                dispatch('loadTxs')
            }
        },
        async loadApprovalRequests({state, commit}: ActionHandlers) {
            let approvalRequests = await bg.confirmation.getApprovalRequests();
            if (!approvalRequests) {
                approvalRequests = []
            }

            console.log("loadApprovalRequests", approvalRequests);
            commit('setApprovalRequests', approvalRequests)
        }
    }
}
