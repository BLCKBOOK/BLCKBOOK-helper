import {ContractAbstraction, ContractProvider, TezosToolkit} from '@taquito/taquito';
import {char2Bytes} from '@taquito/tzip16';
import {admin} from './faucet';
import {
    auctionHouseContractAddress,
    bankContractAddress,
    ipfsPrefix,
    sprayContractAddress,
    theVoteContractAddress,
    tokenContractAddress,
    voterMoneyPoolContractAddress
} from './constants';

export class Originator {

    private fa2ContractMichelsonCode = require('../assets/contract-code/token-contract.json');
    private voterMoneyPoolMichelsonCode = require('../assets/contract-code/voter_money_pool_contract.json');
    private auctionHouseMichelsonCode = require('../assets/contract-code/auction_house_contract.json');
    private theVoteMichelsonCode = require('../assets/contract-code/the_vote.json');
    private sprayMichelsonCode = require('../assets/contract-code/spray.json');
    private bankMichelsonCode = require('../assets/contract-code/bank.json');
    private adminPublicKey = admin.pkh; // aka our admin-address
    private voterMoneyPoolMetaData = require('../assets/contract-metadata/voter-money-pool-metadata.json');
    private fa2ContractMetaData = require('../assets/contract-metadata/fa2-contract-metadata.json');
    private auctionHouseMetaData = require('../assets/contract-metadata/auction_house-metadata.json');
    private theVoteMetaData = require('../assets/contract-metadata/the_vote_metadata.json');
    private sprayMetaData = require('../assets/contract-metadata/spray_metadata.json');

    private initialFA2Storage = `(Pair "${this.adminPublicKey}" (Pair 0 (Pair {} (Pair {} (Pair {} (Pair False {}))))))`;
    private initialVoterMoneyPoolStorage = `(Pair (Pair "${this.adminPublicKey}" (Right Unit)) (Pair {} (Pair {} {})))`;

    public constructor(private tezos: TezosToolkit) {
    }

    getInitialAuctionHouseStorage(tokenAddress: string, voterMoneyPoolAddress: string): string {
        return `(Pair "${this.adminPublicKey}" (Pair "${this.adminPublicKey}" (Pair "${voterMoneyPoolAddress}" (Pair "${tokenAddress}" (Pair 25 (Pair 60 (Pair 15 (Pair 0 (Pair {} {})))))))))`;
    }

    getTheVoteStorage(auctionHouseAddress: string, moneyPoolAddress: string, bankAddress: string, sprayAddress: string, tokenAddress: string): string {
        return `(Pair (Pair (Pair (Pair "${this.adminPublicKey}" 0) (Pair 0 (Pair {} {}))) (Pair (Pair "${auctionHouseAddress}" (Pair "1970-01-08T00:00:00Z" 0)) (Pair 0 (Pair {} 10)))) (Pair (Pair (Pair 0 (Pair 200 10080)) (Pair False (Pair "${bankAddress}" "${sprayAddress}"))) (Pair (Pair "${tokenAddress}" (Pair {} "${moneyPoolAddress}")) (Pair {} (Pair 0 200)))))`
    }

    getSprayStorage(voteAddress: string): string {
        return `(Pair (Pair (Pair "${this.adminPublicKey}" {}) (Pair {} 0)) (Pair (Pair {} {}) (Pair "${voteAddress}" {})))`
    }

    getBankStorage(sprayAddress: string, voteAddress: string): string {
        return `(Pair (Pair "${this.adminPublicKey}" (Pair "${sprayAddress}" "${voteAddress}")) (Pair 5 (Pair 1 {})))`;
    }

    async setContractMetaDataWithHash(contractAddress: string, ipfsHash: string) {
        let contract = await this.tezos.contract.at(contractAddress);
        contract.methodsObject.set_metadata({
            k: '',
            v: char2Bytes(ipfsPrefix + ipfsHash)
        }).send({
            fee: 800
        }).then((op) => {
            console.log(`Waiting for ${op.hash} to be confirmed...`);
            return op.confirmation(2).then(() => op.hash);
        })
            .then((hash) => console.log(`Operation injected: https://ghost.tzstats.com/${hash}`))
            .catch((error) => console.log(`Error: ${JSON.stringify(error, null, 2)}`));
    }


    async originate(code: any, initialStorage: string): Promise<ContractAbstraction<ContractProvider>> {
        let origination = await this.tezos.contract
            .originate({
                code: code,
                init: initialStorage,
            });
        return await origination.contract(2);
    }

    async originateSprayContract() {
        const sprayTokenContract = await this.originate(this.sprayMichelsonCode, this.getSprayStorage(theVoteContractAddress))
        console.log(sprayTokenContract.address)
    }

    async originateTheVoteContract() {
        const theVoteContract = await this.originate(this.theVoteMichelsonCode, this.getTheVoteStorage(auctionHouseContractAddress, voterMoneyPoolContractAddress, bankContractAddress, sprayContractAddress, tokenContractAddress))
        console.log(theVoteContract.address);
    }
    
    async originateAllContracts() {
        /*const tokenContract = await this.originate(this.fa2ContractMichelsonCode, this.initialFA2Storage);
        console.log(tokenContract.address);
        const voterMoneyPoolContract = await this.originate(this.voterMoneyPoolMichelsonCode, this.initialVoterMoneyPoolStorage);
        console.log(voterMoneyPoolContract.address);
        const auctionHouseContract = await this.originate(this.auctionHouseMichelsonCode, this.getInitialAuctionHouseStorage(tokenContract.address, voterMoneyPoolContract.address));
        console.log(auctionHouseContract.address);
        const theVoteContract = await this.originate(this.theVoteMichelsonCode, this.getTheVoteStorage(auctionHouseContract.address, voterMoneyPoolContract.address, tokenContract.address, tokenContract.address, tokenContract.address))
        console.log(theVoteContract.address);*/
        const sprayTokenContract = await this.originate(this.sprayMichelsonCode, this.getSprayStorage(theVoteContractAddress))
        console.log(sprayTokenContract.address)
        const bankContract = await this.originate(this.bankMichelsonCode, this.getBankStorage(sprayTokenContract.address, theVoteContractAddress));
        console.log(bankContract.address)

/*        console.log(`token: ${tokenContract.address}`);
        console.log(`voterMoneyPool: ${voterMoneyPoolContract.address}`);
        console.log(`auctionHouse: ${auctionHouseContract.address}`);
        console.log(`theVote: ${theVoteContract.address}`);
        console.log(`spray: ${sprayTokenContract.address}`);
        console.log(`bank: ${bankContract.address}`);*/

    /*    try {
            await this.setContractMetaDataWithHash(this.voterMoneyPoolContractAddress, this.voterMoneyPoolMetadataIPFSHASH);
            await this.setContractMetaDataWithHash(this.auctionHouseContractAddress, this.auctionHouseMetadataIPFSHASH);
            await this.setContractMetaDataWithHash(this.tokenContractAddress, this.tokenMetadataIPFSHASH);
        } catch (error) {
            console.log(error);
        }*/

    }



}
