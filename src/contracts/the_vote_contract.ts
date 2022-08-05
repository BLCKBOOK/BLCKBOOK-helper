import {MichelsonMap, TezosToolkit, TransactionOperation, TransactionWalletOperation} from '@taquito/taquito';
import {Contract} from './contract';
import {char2Bytes} from '@taquito/tzip16';

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


}

