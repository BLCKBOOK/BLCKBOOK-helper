import {MichelCodecParser, TezosToolkit, TransactionOperation, TransactionWalletOperation} from '@taquito/taquito';
import {Contract} from './contract';

export class SprayContract extends Contract {

    constructor(protected tezos: TezosToolkit, address: string) {
        super(tezos, address);
    }

  /*  async mint(receiver: string, amount: number, variant : 'existing' | 'new', id?: number, metadata?: string) {
        try {
            // ToDo: fix this!
            const token = MichelCodecParser()

            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methodsObject.mint({receiver, amount, token}).send();
            const hash: any | undefined = await call?.confirmation(2);
            console.log(`Operation injected: https://ghost.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }*/
}

