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
    index: string;
}

export interface End {
    end: {};
}

export interface Vote {
    next: Index | End,
    previous: Index | End,
    artwork_id: string,
    vote_amount: string,
}

export interface ArtworkParams {
    ipfsLink: string,
    uploader: string,
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

    async batchAdmission(artworks: ArtworkParams[]) {
        const batch = this.tezos.wallet.batch();
        for (let artwork of artworks) {
            let storageMap = new MichelsonMap({
                prim: 'map',
                args: [{prim: 'string'}, {prim: 'bytes'}],
            });
            storageMap.set('decimals', char2Bytes('0'));
            storageMap.set('', char2Bytes(artwork.ipfsLink));
            if (this.contract) {
                batch.withContractCall(this.contract.methodsObject.admission({
                    uploader: artwork.uploader,
                    metadata: storageMap,
                }));
            }
        }
        /*
         * Here happens all the operation batching
         */
        const batchOp = await batch.send();
        const confirmation = await batchOp.confirmation(1);
        console.log(`Operation injected: https://ghost.tzstats.com/${confirmation.block.hash}`);
    }

    /*
    this will only work if noone else has voted this period!
     */
    async voteBatch(startIndex = 0, amount = 100, artwork_id_offset: number) {
        const batch = this.tezos.wallet.batch();
        for (let i = startIndex; i < startIndex + amount; i++) {
            const new_next = {index: i + 1};
            const new_previous = i === 0 ? {end: UnitValue} : {index: i - 1};
            const voteObject = {
                amount,
                artwork_id: i + artwork_id_offset,
                index: i,
                new_next,
                new_previous
            };

            if (this.contract) {
                batch.withContractCall(this.contract.methodsObject.vote(voteObject));
            }
        }
        /*
         * Here happens all the operation batching
         */
        const batchOp = await batch.send();
        const confirmation = await batchOp.confirmation(1);
        console.log(`Operation injected: https://ghost.tzstats.com/${confirmation.block.hash}`);
    }

    async ready_for_minting(confirmations = 2) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.ready_for_minting().send();
            const hash: any | undefined = await call?.confirmation(confirmations);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async set_minting_ready_limit(new_limit: number, confirmations = 2) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.set_minting_ready_limit(new_limit).send();
            const hash: any | undefined = await call?.confirmation(confirmations);
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
            if (confirmations) {
                const hash: any | undefined = await call?.confirmation(confirmations);
                console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
            }
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async setVotesTransmissionLimitDuringMinting(amount: number): Promise<boolean> {
        do {
            try {
                const call: TransactionWalletOperation | TransactionOperation | undefined
                    = await this.contract?.methods.set_votes_transmission_limit(amount).send();
                const hash: any | undefined = await call?.confirmation(2);
                console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
                return true;
            } catch (error: any) {
                if (error['message'] && (error.message as string).includes('THE_VOTE_CANT_SET_VOTES_TRANSMISSION_LIMIT_DURING_A_BATCH')) {
                    console.log('need to continue to mint artworks until we can set the limit again');
                    await this.mintArtworks(1);
                }
                else {
                    console.log(`Error: ${JSON.stringify(error, null, 2)}`);
                    return false;
                }
            }
        } while (true);
    }

    async mintArtworksUntilReady(): Promise<boolean> {
        let amount = 128;
        if (this.contract) {
            do {
                try {
                    console.log(amount);
                    const call: TransactionWalletOperation | TransactionOperation | undefined
                        = await this.contract?.methods.mint_artworks(amount).send();
                    const hash: any | undefined = await call?.confirmation(2);
                    console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
                    console.log(amount);
                    break;
                } catch (error: any) {
                    if (error['id'] && (error.id as string).includes('gas_exhausted.operation')) {
                        console.log('we have a gas_exhaustion')
                    } else if (error['message'] && (error.message as string).includes('THE_VOTE_CANT_SET_VOTES_TRANSMISSION_LIMIT_DURING_A_BATCH')) {

                    }

                    else {
                        console.log(`Error: ${JSON.stringify(error, null, 2)}`);
                        return false;
                    }
                    amount = Math.floor(amount / 2);
                }
            } while (true);
        }
        return false;
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
        while (previous != -1) {
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
        };

        console.log(voteObject);

        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methodsObject.vote(voteObject).send();
            const hash: any | undefined = await call?.confirmation(2);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }

    }

    private calculateIndex(value: Index | End): number {
        // @ts-ignore
        if (value['index'] != undefined) {
            // @ts-ignore
            return parseInt(value['index']);
        } else {
            return -1;
        }
    }

    async setNextDeadlineMinutes(amount: number) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.set_next_deadline_minutes(amount).send();
            const hash: any | undefined = await call?.confirmation(2);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async setMintingRatio(new_ratio: number) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.set_minting_ratio(new_ratio).send();
            const hash: any | undefined = await call?.confirmation(2);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async set_votes_transmission_limit(new_limit: number) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.set_votes_transmission_limit(new_limit).send();
            const hash: any | undefined = await call?.confirmation(2);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }
}

