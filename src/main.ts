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
import pinataSDK from '@pinata/sdk';

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
const voterMoneyPoolContractAddress = 'KT1XeA6tZYeBCm7aux3SAPswTuRE72R3VUCW';
const auctionHouseContractAddress = 'KT1RG8SzC5exEXedFEpFwjisuAcjjf7TTwNB';

const fa2ContractMichelsonCode = require('../dist/contract-code/token-contract.json');
const voterMoneyPoolMichelsonCode = require('../dist/contract-code/voter_money_pool_contract.json');
const auctionHouseMichelsonCode = require('../dist/contract-code/auction_house_contract.json');
const adminPublicKey = faucet.pkh; // aka our admin-address
const voterMoneyPoolMetaData = require('../dist/contract-metadata/voter-money-pool-metadata.json');
const fa2ContractMetaData = require('../dist/contract-metadata/fa2-contract-metadata.json');
const auctionHouseMetaData = require('../dist/contract-metadata/auction_house-metadata.json');

// the initial storage values for the contracts. Beware that these have addresses in them!
const initialFA2Storage = `(Pair "tz1PEbaFp9jE6syH5xg29YRegbwLLehzK3w2" (Pair 0 (Pair {} (Pair {} (Pair {} (Pair False {}))))))`;
const initialVoterMoneyPoolStorage = '(Pair "tz1PEbaFp9jE6syH5xg29YRegbwLLehzK3w2" (Pair {} (Pair {} {})))';
const initialAuctionHouseStorage = '(Pair "tz1PEbaFp9jE6syH5xg29YRegbwLLehzK3w2" (Pair "tz1PEbaFp9jE6syH5xg29YRegbwLLehzK3w2" (Pair "KT1XeA6tZYeBCm7aux3SAPswTuRE72R3VUCW" (Pair "KT1HAtdXKvXqK2He3Xr2xmHQ9cYrxPTL7X9Z" (Pair 25 (Pair 60 (Pair 15 (Pair 0 (Pair {} {})))))))))'

const ipfsPrefix = 'ipfs://';
// ipfs links for the metadata. Uploaded with pinata (web browser)
const contractMetadataIpfsKey = 'QmaXB89rnWPU9x2cDzHEy5YPdoK9epzRqgc7Lv8bvUv6ck';
const voterMoneyPoolMetadataIpfsKey = 'QmbdCxkLZUxDPVu8JDDbFTHXU1fkdzEy7QsoTBsY8pKzZa';

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
        .catch((error) => console.log(error));
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
    }

    async getCurrentTokenIndex(): Promise<number | undefined> {
        try {
            const storage = await this.contract?.storage();
            return (storage as any).all_tokens.toNumber() as number;
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
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
            console.log(`Operation injected: https://hangzhou.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async set_voter_money_pool_address(new_address: string, confirmations = 3) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.set_voter_money_pool_address(new_address).send();
            const hash: any | undefined = await call?.confirmation(confirmations);
            console.log(`Operation injected: https://hangzhou.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async set_tokens_contract_address(new_address: string, confirmations = 3) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.set_tokens_contract_address(new_address).send();
            const hash: any | undefined = await call?.confirmation(confirmations);
            console.log(`Operation injected: https://hangzhou.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async set_blckbook_collector(new_address: string, confirmations = 3) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.set_blckbook_collector(new_address).send();
            const hash: any | undefined = await call?.confirmation(confirmations);
            console.log(`Operation injected: https://hangzhou.tzstats.com/${hash}`);
        } catch (error) {
            console.log(`Error: ${JSON.stringify(error, null, 2)}`);
        }
    }

    async end_auction(auction_index: number, confirmations = 3) {
        try {
            const call: TransactionWalletOperation | TransactionOperation | undefined
                = await this.contract?.methods.end_auction(auction_index).send();
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

async function setContractMetaData(contractAddress: string, metadataJson: any, nameOfThePinataPin: string) {
    const pinataResponse = await pinata.pinJSONToIPFS(metadataJson, {pinataMetadata: {name: nameOfThePinataPin}});
    const contract = await Tezos.contract.at(contractAddress);
    contract.methodsObject.set_metadata({
        k: '',
        v: char2Bytes(ipfsPrefix + pinataResponse.IpfsHash)
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

// ToDo: refactor me as contract method
async function getAmountInMoneyPool(): Promise<number> {
    const contract = await Tezos.contract.at(voterMoneyPoolContractAddress, tzip16);
    const views = await contract.tzip16().metadataViews();
    const ret = (await views.get_balance().executeView(adminPublicKey)).toNumber();
    console.log(ret);
    return ret;
}

async function getExpiredAuctions(): Promise<number> {
    const contract = await Tezos.contract.at(auctionHouseContractAddress, tzip16);
    const views = await contract.tzip16().metadataViews();
    const date = '2021-12-10T00:00:00Z' // ToDo: another date String... please figure me out
    const ret = (await views.get_expired_auctions().executeView(date));
    console.log((ret as Array<any>).map(number => number.toNumber()))
    return ret;
}

function createTokenMetadata(artworkName: string, minterAddress: string, uploaderAddress: string, blckbookAddress: string, timestamp: string,
                             artifactAndDisplayUri: string, thumbnailUri: string, mimeType: string, longitude: string, latitude: string) {
    return {
        decimals: 0, // klar
        isBooleanAmount: true,
        name: artworkName ?? 'Nameless Spot',
        description: 'A Spot of a Graffiti on the BLCKBOOK',
        minter: minterAddress,
        creators: [uploaderAddress, blckbookAddress],
        date: timestamp,
        type: 'BLCKBOOK NFT',
        tags: ['Street-Art', 'Graffiti', 'Art'],
        language: 'en',
        artifactUri: artifactAndDisplayUri,
        displayUri: artifactAndDisplayUri,
        thumbnailUri, //scaled down version of the asset for wallets and client applications (max size 350x350)",
        shouldPreferSymbol: false,
        symbol: 'BLCKBOOK',
        formats: [
            {
                uri: artifactAndDisplayUri,
                mimeType,
            }
        ],
        attributes: [{
            name: 'longitude',
            value: longitude
        },
            {
                name: 'latitude',
                'value': latitude
            },
        ]
    };
}

const fa2Contract = new FA2Contract();
const auctionHouseContract = new AuctionHouseContract();
const voterMoneyPoolContract = new VoterMoneyPoolContract();

// this is basically the main functionality
/*Promise.all([fa2Contract.Ready, auctionHouseContract.Ready, voterMoneyPoolContract.Ready]).then(async () => {
    console.log('all contracts loaded');

    const ipfsUploadCode = 'QmfNemw9hXhYidhEUifUnp9W34dLnALwPwXUczuejMiHfa'; //ToDo: actually upload an image
    const ipfsThumbnailCode = 'QmfNemw9hXhYidhEUifUnp9W34dLnALwPwXUczuejMiHfa'; //ToDo: actually upload a thumbnail
    const tokenMetadata = createTokenMetadata('testArtwork', adminPublicKey, adminPublicKey, adminPublicKey, '2021-12-09T17:52:24.005Z',
        ipfsPrefix + ipfsUploadCode, ipfsUploadCode + ipfsThumbnailCode, 'image/png', '121', '201');
    const pinataResponse = await pinata.pinJSONToIPFS(tokenMetadata, undefined);

    const currentTokenIndex = await fa2Contract.getCurrentTokenIndex();

    if (currentTokenIndex !== undefined) {
        await fa2Contract.mint(ipfsPrefix + pinataResponse.IpfsHash, currentTokenIndex, auctionHouseContractAddress, 1);
        const timestamp = '2021-12-19T00:00:00Z'; //ToDo: create a timestamp that is good
        await auctionHouseContract.create_auction(currentTokenIndex, 1000000, timestamp, adminPublicKey, 2, 1);
        await voterMoneyPoolContract.addVotes(currentTokenIndex, [adminPublicKey, 'tz1a5TTiks52KuaXRaQw8vVwHuCTr5JtWgPF'], 1);
        // the voter money pool doesn't have any security... meaning that if the votes are added twice for the same index... we are f....
    }
});*/


//originate(auctionHouseMichelsonCode, initialAuctionHouseStorage);
//setContractMetaData(voterMoneyPoolContractAddress, voterMoneyPoolMetaData, 'voterMoneyPoolMetaData') // example for setting meta-data
//setContractMetaData(auctionHouseContractAddress, auctionHouseMetaData, 'auctionHouseMetaData')
// setContractMetaData(tokenContractAddress, fa2ContractMetaData, 'tokenContractMetaData')

getExpiredAuctions()
