import {TezosToolkit, TransactionOperation, TransactionWalletOperation} from '@taquito/taquito';
import {Contract} from './contract';
import fetch from 'node-fetch';
import {contracts, tzktAddress} from '../constants';

export class BankContract extends Contract {

    constructor(protected tezos: TezosToolkit, address: string) {
        super(tezos, address);
    }

    async setSprayAddress(new_address: string) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.set_spray_address(new_address).send();
            const hash: any | undefined = await call?.confirmation(2);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async setTheVoteAddress(new_address: string) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.set_the_vote_address(new_address).send();
            const hash: any | undefined = await call?.confirmation(2);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async setWithdrawLimit(amount: number) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.set_withdraw_limit(amount).send();
            const hash: any | undefined = await call?.confirmation(2);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async setNewPeriod() {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.set_new_period().send();
            const hash: any | undefined = await call?.confirmation(2);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async registerUser(address: string) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.register_user(address).send();
            const hash: any | undefined = await call?.confirmation(2);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async withdraw() {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.withdraw().send();
            const hash: any | undefined = await call?.confirmation(2);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async canWithdraw(withdrawer: string): Promise<any> {
        try {
            const viewResult = await this.contract?.contractViews.can_withdraw().executeView({ viewCaller: withdrawer, source: withdrawer})
            console.log(`View Result: ${viewResult}`);
            return viewResult;
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async userIsRegistered(userKey: string): Promise<any> {
        const withdrawlsBigMap = await fetch(`${tzktAddress}contracts/${contracts.bankContractAddress}/bigmaps/withdrawls`);
        const withdrawlsBigMapAddress = (await withdrawlsBigMap.json()).ptr;


        const url = `${tzktAddress}bigmaps/${withdrawlsBigMapAddress}/keys/${userKey}`;
        console.log(url);
        const response = await fetch(url);
        console.log(response);
        const data = await response.json();
        console.log(data);
    }
}

