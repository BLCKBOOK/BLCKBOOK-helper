import {
    MichelsonMap,
    TezosToolkit,
    TransactionOperation,
    TransactionWalletOperation,
    UnitValue
} from '@taquito/taquito';
import {Contract} from './contract';
import {char2Bytes} from '@taquito/tzip16';
import {theVoteContractAddress} from '../constants';
import fetch from 'node-fetch';
import assert from 'assert';

export interface Index {
    index: string
}

export interface End {
    end: {}
}

export interface Vote {
    next: Index | End,
    previous: Index | End,
    artwork_id: string,
    vote_amount: string,
}


export class TheVoteContract extends Contract {

    constructor(protected tezos: TezosToolkit, address: string) {
        super(tezos, address);
    }

    async setSprayBankAddress(new_address: string) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.set_spray_bank_address(new_address).send();
            const hash: any | undefined = await call?.confirmation(2);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async setAdminOfPoolContract(new_address: string) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.set_admin_of_pool_contract(new_address).send();
            const hash: any | undefined = await call?.confirmation(2);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async setAdminOfTokenContract(new_address: string) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.set_admin_of_token_contract(new_address).send();
            const hash: any | undefined = await call?.confirmation(2);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async setAdminOfAuctionContract(new_address: string) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.set_admin_of_auction_contract(new_address).send();
            const hash: any | undefined = await call?.confirmation(2);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async setSprayAddress(new_address: string) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.set_spray_contract(new_address).send();
            const hash: any | undefined = await call?.confirmation(2);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async setTokenContractAddress(new_address: string) {

        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.set_tokens_contract_address(new_address).send();
            const hash: any | undefined = await call?.confirmation(2);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async setVoterMoneyPoolAddress(new_address: string) {

        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.set_voter_money_pool_address(new_address).send();
            const hash: any | undefined = await call?.confirmation(2);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async admission(ipfsLink: string, ownerAddress: string, confirmations = 2) {
        const storageMap = new MichelsonMap({
            prim: 'map',
            args: [{prim: 'string'}, {prim: 'bytes'}],
        });
        storageMap.set('decimals', char2Bytes('0'));
        storageMap.set('', char2Bytes(ipfsLink));
        try {
            // @ts-ignore
            const call: TransactionWalletOperation | TransactionOperation | undefined = await this.contract.methodsObject.admission({
                    uploader: ownerAddress,
                    metadata: storageMap,
                }
            ).send();
            const hash: any | undefined = await call?.confirmation(confirmations);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async mintArtworks(amount: number) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.mint_artworks(amount).send();
            const hash: any | undefined = await call?.confirmation(2);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async getVoteObject() {
        const ret = await this.contract?.methodsObject.vote().getSignature();
        console.log(ret);
        console.log(ret.token);
    }

    // ToDo: write vote method that calculates the new_next and new_previous from amount, artwork_id and index

    /**
     * uses tzkt-addresses instead of Taquito so this can be used in the browser!
     * @param amount
     * @param artwork_id
     * @param index
     */
    async calculateAndVote(amount: number, artwork_id: number, index: number) {

        const bigMapAddress = await fetch(`https://api.ghostnet.tzkt.io/v1/contracts/${theVoteContractAddress}/bigmaps/votes`);
        const votesBigMapAddress = (await bigMapAddress.json()).ptr;


        const response = await fetch(`https://api.ghostnet.tzkt.io/v1/bigmaps/${votesBigMapAddress}/keys/${index}`);
        const data = await response.json();
        const startEntry = data.value as Vote;

        const response2 = await fetch(`https://api.ghostnet.tzkt.io/v1/contracts/${theVoteContractAddress}/storage`);
        const storageData = await response2.json();

        const highestVoteIndex = parseInt(storageData.highest_vote_index);
        // const lowestVoteIndex = parseInt(storageData.lowest_vote_index);

        if (!(startEntry.artwork_id === artwork_id.toString())) {
            console.error('wrong artwork_id');
            assert(startEntry.artwork_id === artwork_id.toString()); //ToDo use exceptions
        }

        const currentVoteAmount = parseInt(startEntry.vote_amount) + amount;
        let previous = this.calculateIndex(startEntry.previous);
        let next = this.calculateIndex(startEntry.next);
        console.log(next);
        console.log(previous);
        while(previous != -1) {
            let previousResponse = await fetch(`https://api.ghostnet.tzkt.io/v1/bigmaps/${votesBigMapAddress}/keys/${previous}`);
            const previousEntry = (await previousResponse.json()).value as Vote;
            if (parseInt(previousEntry.vote_amount) >= currentVoteAmount) {
                next = this.calculateIndex(previousEntry.next);
                break;
            } else {
                previous = this.calculateIndex(previousEntry.previous);
            }
        }
        if (previous === -1 && index != highestVoteIndex) { // this means we replaced the formerly highest as the new highest
            next = highestVoteIndex;
        }

        if (next === index) { // we can not point to ourselves
            next = this.calculateIndex(startEntry.next);
        }

        await this.vote(amount, artwork_id, index, next, previous);
    }

    async vote(amount: number, artwork_id: number, index: number, new_next_index: number, new_previous_index: number) {

        const new_next = new_next_index < 0 ? {end: UnitValue} : {index: new_next_index};
        const new_previous = new_previous_index < 0 ? {end: UnitValue} : {index: new_previous_index};
        const voteObject = {
            amount,
            artwork_id,
            index,
            new_next,
            new_previous
        }

        console.log(voteObject);

        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methodsObject.vote(voteObject).send();
            const hash: any | undefined = await call?.confirmation(2);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }

/*        const params = {
            amount, artwork_id,
        }
            amount: 'nat',
            artwork_id: 'nat',
            index: 'nat',
            new_next: { end: 'unit', index: 'nat' },
        new_previous: { end: 'unit', index: 'nat' }*/


    }

    private calculateIndex(value: Index | End): number {
        // @ts-ignore
        if (value['index'] != undefined) {
            // @ts-ignore
            return parseInt(value['index']);
        } else {
            return -1
        }
    }
}

