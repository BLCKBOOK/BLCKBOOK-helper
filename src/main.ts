import {ContractAbstraction, ContractProvider, TezosToolkit} from '@taquito/taquito';
import {faucet} from './faucet';
import {pinataKeys} from './pinata-keys';
import {importKey} from '@taquito/signer';
import {Tzip16Module} from '@taquito/tzip16';
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

const tokenContractAddress = 'KT18tsEcP2KoD3U4EdMUderfmxyWBzgo2QF2';
const voterMoneyPoolContractAddress = 'KT1VxugM5e8sbYza6zL1V6c8cJthyrVKRrEj';
const auctionHouseContractAddress = 'KT1EP3cZPv8tCqCRtuVGwkGHL7JagUigHktw';


/*const tokenContractAddress = 'KT1HAtdXKvXqK2He3Xr2xmHQ9cYrxPTL7X9Z';
const voterMoneyPoolContractAddress = 'KT1XeA6tZYeBCm7aux3SAPswTuRE72R3VUCW';
const auctionHouseContractAddress = 'KT1RG8SzC5exEXedFEpFwjisuAcjjf7TTwNB';
const withoutMinTimeAuctionContractAddress = 'KT1Jaasrh4vHoAKaMm8WAhtRTdyuHVVkQwzw'*/

const fa2ContractMichelsonCode = require('../dist/contract-code/token-contract.json');
const voterMoneyPoolMichelsonCode = require('../dist/contract-code/voter_money_pool_contract.json');
const auctionHouseMichelsonCode = require('../dist/contract-code/auction_house_contract.json');
const adminPublicKey = faucet.pkh; // aka our admin-address
const voterMoneyPoolMetaData = require('../dist/contract-metadata/voter-money-pool-metadata.json');
const fa2ContractMetaData = require('../dist/contract-metadata/fa2-contract-metadata.json');
const auctionHouseMetaData = require('../dist/contract-metadata/auction_house-metadata.json');
const auctionHouseMichelsonCodeWithoutMinTime = require('../dist/contract-code/auction_house_without_min_time_contract.json');

const tokenMetadataIPFSHASH = 'QmSRcEPjcSYe2gfzxy4XFcALqGW5Qs43wDxvGM5WJ7YdSL';
const voterMoneyPoolMetadataIPFSHASH = 'QmfXoxCxWx1y5ZsBgjv1o44RCLWr7kY2UEPmGY53BZSSt5';
const auctionHouseMetadataIPFSHASH = 'QmcFwyQrbC4T9PssGbEgpSuH4RM486jbb7aj4xUD6RqSNU';

// the initial storage values for the contracts. Beware that these have addresses in them!
const initialFA2Storage = `(Pair "${adminPublicKey}" (Pair 0 (Pair {} (Pair {} (Pair {} (Pair False {}))))))`;
const initialVoterMoneyPoolStorage = `(Pair "${adminPublicKey}" (Pair {} (Pair {} {})))`;

function getInitialAuctionHouseStorage(tokenAddress: string, voterMoneyPoolAddress: string): string {
    return `(Pair "${adminPublicKey}" (Pair "tz1PEbaFp9jE6syH5xg29YRegbwLLehzK3w2" (Pair "${voterMoneyPoolAddress}" (Pair "${tokenAddress}" (Pair 25 (Pair 60 (Pair 15 (Pair 0 (Pair {} {})))))))))`;
}

const ipfsPrefix = 'ipfs://';

// ipfs links for the metadata. Uploaded with pinata (web browser)

async function originate(code: any, initialStorage: string): Promise<ContractAbstraction<ContractProvider>> {
    const origination = await Tezos.contract
        .originate({
            code: code,
            init: initialStorage,
        });
    const contract = await origination.contract(2);
    return contract;
}

function char2Bytes(str: string) {
    return Buffer.from(str, 'utf8').toString('hex');
}

async function setContractMetaDataWithHash(contractAddress: string, ipfsHash: string) {
    const contract = await Tezos.contract.at(contractAddress);
    contract.methodsObject.set_metadata({
        k: '',
        v: char2Bytes(ipfsPrefix + ipfsHash)
    }).send().then((op) => {
        console.log(`Waiting for ${op.hash} to be confirmed...`);
        return op.confirmation(2).then(() => op.hash);
    })
        .then((hash) => console.log(`Operation injected: https://hangzhou.tzstats.com/${hash}`))
        .catch((error) => console.log(`Error: ${JSON.stringify(error, null, 2)}`));
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

async function originateAllContracts() {
    const tokenContract = await originate(fa2ContractMichelsonCode, initialFA2Storage);
    console.log(tokenContract.address);
    const voterMoneyPoolContract = await originate(voterMoneyPoolMichelsonCode, initialVoterMoneyPoolStorage);
    console.log(voterMoneyPoolContract.address);
    const auctionHouseContract = await originate(auctionHouseMichelsonCodeWithoutMinTime, getInitialAuctionHouseStorage(tokenContract.address, voterMoneyPoolContract.address));
    console.log(auctionHouseContract.address);
    try {
        await setContractMetaDataWithHash(voterMoneyPoolContractAddress, voterMoneyPoolMetadataIPFSHASH); // example for setting meta-data
        await setContractMetaDataWithHash(auctionHouseContractAddress, auctionHouseMetadataIPFSHASH);
        await setContractMetaDataWithHash(tokenContractAddress, tokenMetadataIPFSHASH);
    } catch (error) {
        console.log(error);
    }
    console.log(`token: ${tokenContract.address}`);
    console.log(`voterMoneyPool: ${voterMoneyPoolContract.address}`);
    console.log(`auctionHouse: ${auctionHouseContract.address}`);
}

// originateAllContracts().then(() => console.log('all successful'));

// originate(auctionHouseMichelsonCodeWithoutMinTime, initialAuctionHouseStorage);
// originate(fa2ContractMichelsonCode, initialFA2Storage);


/*printContractMethods(auctionHouseContractAddress);

getExpiredAuctions()*/
