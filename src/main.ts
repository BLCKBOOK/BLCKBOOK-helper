import {
    ContractAbstraction,
    MichelsonMap,
    TezosToolkit,
    TransactionOperation,
    TransactionWalletOperation
} from '@taquito/taquito';
import {faucet} from './faucet';
import {pinataKeys} from './pinata-keys';
import {importKey} from '@taquito/signer';
import {tzip16, Tzip16Module} from '@taquito/tzip16';
import pinataSDK from '@pinata/sdk'

const Tezos = new TezosToolkit('https://hangzhounet.api.tez.ie');
Tezos.addExtension(new Tzip16Module());

importKey(
    Tezos,
    faucet.email,
    faucet.password,
    faucet.mnemonic.join(' '),
    faucet.activation_code
).catch((e: any) => console.error(e));

// now do the setup for Pinata
const pinata = pinataSDK(pinataKeys.key, pinataKeys.secret);

pinata.testAuthentication().then((result) => {
    //handle successful authentication here
    console.log(result);
}).catch((err) => {
    //handle error here
    console.log(err);
});

const tokenContractAddress = 'KT1HAtdXKvXqK2He3Xr2xmHQ9cYrxPTL7X9Z';
const voterMoneyPoolContractAddress = 'KT1Qs5B5b2eo6TqqhEJ3LNzBRSoQahEQK4tZ';
const auctionHouseContractAddress = 'KT1EzPEVrZKSHpUjaYCGpdFT6o9Sauq6FhjP';

const fa2ContractMichelsonCode = require('../dist/token-contract.json');
const voterMoneyPoolMichelsonCode = require('../dist/voter_money_pool_contract.json');
const auctionHouseMichelsonCode = require('../dist/auction_house_contract.json');
const adminPublicKey = faucet.pkh; // aka our admin-address

// the initial storage values for the contracts. Beware that these have addresses in them!
const initialFA2Storage = `(Pair "tz1PEbaFp9jE6syH5xg29YRegbwLLehzK3w2" (Pair 0 (Pair {} (Pair {} (Pair {} (Pair False {}))))))`;
const initialVoterMoneyPoolStorage = '(Pair "tz1PEbaFp9jE6syH5xg29YRegbwLLehzK3w2" (Pair {} (Pair {} {})))';
const initialAuctionHouseStorage = '(Pair "tz1PEbaFp9jE6syH5xg29YRegbwLLehzK3w2" (Pair "tz1PEbaFp9jE6syH5xg29YRegbwLLehzK3w2" (Pair "KT1Qs5B5b2eo6TqqhEJ3LNzBRSoQahEQK4tZ" (Pair "KT1HAtdXKvXqK2He3Xr2xmHQ9cYrxPTL7X9Z" (Pair 25 (Pair 60 (Pair 15 (Pair 0 {}))))))))';

const ipfsPrefix = 'ipfs://';
// ipfs links for the metadata. Uploaded with pinata
const contractMetadataIpfsKey = 'QmaXB89rnWPU9x2cDzHEy5YPdoK9epzRqgc7Lv8bvUv6ck';
const voterMoneyPoolMetadataIpfsKey = 'QmVPo1mxMTFSWcmFARMzdt6ieaYuvZj73nQKHNUPaBKsKY';

function originate(code: any, initialStorage: string) {
    Tezos.contract
        .originate({
            code: code,
            init: initialStorage,
        })
        .then((originationOp) => {
            console.log(`Waiting for confirmation of origination for ${originationOp.contractAddress}...`);
            return originationOp.contract();
        })
        .then((contract) => {
            console.log(`Origination completed.`);
        })
        .catch((error) => console.log(`Error: ${JSON.stringify(error, null, 2)}`));
}

/**
 * abstract class for a contract. Has a ready for initialization so that we can call other methods on it
 */
abstract class Contract {
    public Ready: Promise<void>;
    protected contract: ContractAbstraction<any> | undefined;

    protected constructor(contractAddress: string) {
        this.Ready = new Promise((resolve, reject) => {
            Tezos.contract.at(contractAddress).then(result => {
                this.contract = result;
                resolve(undefined);
            }).catch(reject);
        });
    }
}

class FA2Contract extends Contract {

    constructor() {
        super(tokenContractAddress);
    }

    async burn(ownerAddress: string, tokenId: number, confirmations = 3) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined = await this.contract?.methods.burn(ownerAddress, tokenId).send();
            const hash: any | undefined = await call?.confirmation(confirmations);
            console.log(`Operation injected: https://hangzhou.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async mint(ipfsLink: string, tokenId: number, ownerAddress: string, confirmations = 3) {
        const storageMap = new MichelsonMap({
            prim: 'map',
            args: [{prim: 'string'}, {prim: 'bytes'}],
        });
        storageMap.set('decimals', char2Bytes('0'));
        storageMap.set('', char2Bytes(ipfsLink));
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined = await this.contract?.methods.mint(
                ownerAddress, 1, storageMap, tokenId
            ).send();
            const hash: any | undefined = await call?.confirmation(confirmations);
            console.log(`Operation injected: https://hangzhou.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }

        async function getCurrentTokenIndex(): Promise<number> {
            const contract = await Tezos.contract.at(tokenContractAddress);
            const storage = await contract.storage();
            return (storage as any).all_tokens.toNumber() as number;
        }
    }
}

class VoterMoneyPoolContract extends Contract {
    constructor() {
        super(voterMoneyPoolContractAddress);
    }

    async addVotes(auctionAndTokenId: number, voterAddresses: string[], confirmations = 3) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined = await this.contract?.methods.add_votes(auctionAndTokenId, voterAddresses).send();
            const hash: any | undefined = await call?.confirmation(confirmations);
            console.log(`Operation injected: https://hangzhou.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }
}

class AuctionHouseContract extends Contract {
    constructor() {
        super(auctionHouseContractAddress);
    }

    'schema:object': {
        'auction_and_token_id:nat': 'nat',
        'bid_amount:mutez': 'mutez',
        'end_timestamp:timestamp': 'timestamp',
        'uploader:address': 'address',
        'voter_amount:nat': 'nat'
    };

    async create_auction(auction_and_token_id: number, bid_amount: number, end_timestamp: number, uploader: string, voter_amount: number, confirmations = 3) {
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
            console.log(`Operation injected: https://hangzhou.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }
}

async function printBalance(address: string) {
    const balance = await Tezos.tz
        .getBalance(address);
    console.log(`${balance.toNumber() / 1000000} ꜩ`);
}

function char2Bytes(str: string) {
    return Buffer.from(str, 'utf8').toString('hex');
}

function printContractMethods(contractAddress: string) {
    Tezos.contract
        .at(contractAddress)
        .then((c) => {
            let methods = c.parameterSchema.ExtractSignatures();
            console.log(JSON.stringify(methods, null, 2));
        })
        .catch((error) => console.log(`Error: ${error}`));
}

async function setContractMetaData(contractAddress: string, contractIpfsMetadata: string) {
    const contract = await Tezos.contract.at(contractAddress);
    contract.methodsObject.set_metadata({
        k: '',
        v: char2Bytes(ipfsPrefix + contractIpfsMetadata)
    }).send().then((op) => {
        console.log(`Waiting for ${op.hash} to be confirmed...`);
        return op.confirmation(3).then(() => op.hash);
    })
        .then((hash) => console.log(`Operation injected: https://hangzhou.tzstats.com/${hash}`))
        .catch((error) => console.log(`Error: ${JSON.stringify(error, null, 2)}`));
}

/*getCurrentTokenIndex().then(tokenIndex => {
    for (let i = 0; i < 2; i++) {
        mint('no real link... sorry', i + tokenIndex, adminPublicKey);
    } // this does not work to mint multiple tokens as the number isn't updated in the storage, when the contract-call is made
});*/

async function testTzip16Metadata(contractAddress: string) {
    const contract = await Tezos.contract.at(contractAddress, tzip16);
    const metadata = await contract.tzip16().getMetadata();
    const views = await contract.tzip16().metadataViews();
    console.log(metadata);
    console.log(views);
}

/**
 * Get's the contract, it's views and then returns the count_tokens view
 * @ret the count_tokens view which is the current token_index
 */
async function getCountTokensFromView(): Promise<number> {
    const contract = await Tezos.contract.at(tokenContractAddress, tzip16);
    const views = await contract.tzip16().metadataViews();
    const ret = (await views.count_tokens().executeView()).toNumber();
    return ret;
}

async function getAmountInMoneyPool(): Promise<number> {
    const contract = await Tezos.contract.at(voterMoneyPoolContractAddress, tzip16);
    const views = await contract.tzip16().metadataViews();
    const ret = (await views.get_balance().executeView(adminPublicKey)).toNumber();
    console.log(ret);
    return ret;
}

const fa2Contract = new FA2Contract();
fa2Contract.Ready.then(() => {
    console.log('fa2 contract loaded');
});

const voterMoneyPoolContract = new VoterMoneyPoolContract();
voterMoneyPoolContract.Ready.then(async () => {
    console.log('voter money pool contract loaded');
    // example for adding votes:
    // await voterMoneyPoolContract.addVotes(1, [adminPublicKey, 'tz1a5TTiks52KuaXRaQw8vVwHuCTr5JtWgPF']);
});

// originate(auctionHouseMichelsonCode, initialAuctionHouseStorage); example for origination
