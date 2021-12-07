import {MichelsonMap, TezosToolkit} from '@taquito/taquito';
import {faucet} from './faucet';
import {importKey} from '@taquito/signer';

const Tezos = new TezosToolkit('https://hangzhounet.api.tez.ie');


importKey(
    Tezos,
    faucet.email,
    faucet.password,
    faucet.mnemonic.join(' '),
    faucet.activation_code
).catch((e: any) => console.error(e));

const tokenContractAddress = 'KT1QALmg4PfA1ZDNYWhmWXMNpZhdwLdNbfMz';

const genericMultisigJSONfile = require('../dist/contract.json');
const adminPublicKey = faucet.pkh;
const initialFA2Storage = `(Pair "tz1PEbaFp9jE6syH5xg29YRegbwLLehzK3w2" (Pair 0 (Pair {} (Pair {} (Pair {} (Pair False {}))))))`;

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

getCurrentTokenIndex().then(tokenIndex => {
    for (let i = 0; i < 2; i++) {
        mint('no real link... sorry', i + tokenIndex, adminPublicKey);
    } // this does not work to mint multiple tokens as the number isn't updated in the storage, when the contract-call is made
});
