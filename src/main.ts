import {MichelsonMap, TezosToolkit} from '@taquito/taquito';
import {faucet} from './faucet';
import {importKey} from '@taquito/signer';
import {tzip16, Tzip16Module} from '@taquito/tzip16';

const Tezos = new TezosToolkit('https://hangzhounet.api.tez.ie');
Tezos.addExtension(new Tzip16Module());

importKey(
    Tezos,
    faucet.email,
    faucet.password,
    faucet.mnemonic.join(' '),
    faucet.activation_code
).catch((e: any) => console.error(e));

const tokenContractAddress = 'KT1QALmg4PfA1ZDNYWhmWXMNpZhdwLdNbfMz';

const fa2ContractMichelsonCode = require('../dist/token-contract.json');
const voterMoneyPoolMichelsonCode = require('../dist/voter_money_pool_contract.json');
const adminPublicKey = faucet.pkh;
const initialFA2Storage = `(Pair "tz1PEbaFp9jE6syH5xg29YRegbwLLehzK3w2" (Pair 0 (Pair {} (Pair {} (Pair {} (Pair False {}))))))`;
const initialVoterMoneyPoolStorage = '(Pair "tz1PEbaFp9jE6syH5xg29YRegbwLLehzK3w2" (Pair {} (Pair {} {})))'
const contractMetadataIpfsKey = 'QmaXB89rnWPU9x2cDzHEy5YPdoK9epzRqgc7Lv8bvUv6ck'
const ipfsPrefix = 'ipfs://'
const voterMoneyPoolMetadataIpfsKey = 'QmVPo1mxMTFSWcmFARMzdt6ieaYuvZj73nQKHNUPaBKsKY'
const voterMoneyPoolContractAddress = 'KT1WdC4Qy9p2Wixfs2M16iwnauUXGAaAZJAV'

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

function burn(ownerAddress: string, tokenId: number) {
    Tezos.contract
        .at(tokenContractAddress)
        .then((contract) => {
            console.log(`Trying to burn it ${ownerAddress}, ${tokenId}`);
            return contract.methods
                .burn(
                    ownerAddress, tokenId
                ).send();
        })
        .then((op) => {
            console.log(`Waiting for ${op.hash} to be confirmed...`);
            return op.confirmation(3).then(() => op.hash);
        })
        .then((hash) => console.log(`Operation injected: https://hangzhou.tzstats.com/${hash}`))
        .catch((error) => console.log(`Error: ${JSON.stringify(error, null, 2)}`));
}

function mint(ipfsLink: string, tokenId: number, ownerAddress: string) {
    const storageMap = new MichelsonMap({
        prim: 'map',
        args: [{prim: 'string'}, {prim: 'bytes'}],
    });
    storageMap.set('decimals', char2Bytes('0'));
    storageMap.set('', char2Bytes(ipfsLink));
    Tezos.contract
        .at(tokenContractAddress)
        .then((contract) => {
            console.log('Trying to mint the first thing');
            return contract.methods
                .mint(
                    ownerAddress, 1, storageMap, tokenId
                ).send();
        })
        .then((op) => {
            console.log(`Waiting for ${op.hash} to be confirmed...`);
            return op.confirmation(3).then(() => op.hash);
        })
        .then((hash) => console.log(`Operation injected: https://hangzhou.tzstats.com/${hash}`))
        .catch((error) => console.log(`Error: ${JSON.stringify(error, null, 2)}`));
}

async function getCurrentTokenIndex(): Promise<number> {
    const contract = await Tezos.contract.at(tokenContractAddress);
    const storage = await contract.storage()
    return (storage as any).all_tokens.toNumber() as number;
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
    const contract = await Tezos.contract.at(contractAddress, tzip16)
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
    const contract = await Tezos.contract.at(tokenContractAddress, tzip16)
    const views = await contract.tzip16().metadataViews();
    const ret = (await views.count_tokens().executeView()).toNumber();
    return ret;
}

async function getAmountInMoneyPool(): Promise<number> {
    const contract = await Tezos.contract.at(voterMoneyPoolContractAddress, tzip16)
    const views = await contract.tzip16().metadataViews();
    const ret = (await views.get_balance().executeView(adminPublicKey)).toNumber();
    console.log(ret);
    return ret;
}

getAmountInMoneyPool();
