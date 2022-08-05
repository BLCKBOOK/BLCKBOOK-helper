import {Contract} from './contract';
import {TezosToolkit, TransactionOperation, TransactionWalletOperation} from '@taquito/taquito';
import {tzip16} from '@taquito/tzip16';

export class AuctionHouseContract extends Contract {
    constructor(protected tezos: TezosToolkit, address: string) {
        super(tezos, address);
    }

    async create_auction(auction_and_token_id: number, bid_amount: number, end_timestamp: string, uploader: string, voter_amount: number, confirmations = 3) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methodsObject.create_auction({
                auction_and_token_id,
                bid_amount,
                end_timestamp,
                uploader,
                voter_amount
            }).send();
            const hash: any | undefined = await call?.confirmation(confirmations);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async set_voter_money_pool_address(new_address: string, confirmations = 3) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.set_voter_money_pool_address(new_address).send();
            const hash: any | undefined = await call?.confirmation(confirmations);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async set_tokens_contract_address(new_address: string, confirmations = 3) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.set_tokens_contract_address(new_address).send();
            const hash: any | undefined = await call?.confirmation(confirmations);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async set_blckbook_collector(new_address: string, confirmations = 3) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.set_blckbook_collector(new_address).send();
            const hash: any | undefined = await call?.confirmation(confirmations);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async end_auction(auction_index: number, confirmations = 3) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.end_auction(
                auction_index).send();
            const hash: any | undefined = await call?.confirmation(confirmations);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(error);
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }


    // TODO: add the offchain view for seeing which auctions can be resolved
    // Maybe add TZIP16 to the actual contract :shrug

    async getExpiredAuctions(): Promise<number> {
        const contract = await this.tezos.contract.at(this.getAddress(), tzip16);
        const views = await contract.tzip16().metadataViews();
        const date = new Date().toISOString();
        const ret = (await views.get_expired_auctions().executeView(date));
        console.log((ret as Array<any>).map(number => number.toNumber()));
        return ret;
    }

}
