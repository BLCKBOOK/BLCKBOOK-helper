import {ContractAbstraction, ContractProvider, TezosToolkit} from '@taquito/taquito';
import {char2Bytes} from '@taquito/tzip16';
import {admin} from './faucet';
import {
    ipfsPrefix, sprayTOKENMetadata,
} from './constants';
import {TheVoteContract} from './contracts/the_vote_contract';
import {BankContract} from './contracts/bank_contract';
import {FA2TokenContract} from './contracts/fa2_token_contract';
import {VoterMoneyPoolContract} from './contracts/voter_money_pool_contract';
import {SprayContract} from './contracts/spray_contract';
import {AuctionHouseContract} from './contracts/auction_house_contract';

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
        return `(Pair (Pair (Pair (Pair "${this.adminPublicKey}" 0) (Pair 0 (Pair {} {}))) (Pair (Pair "${auctionHouseAddress}" (Pair "1970-01-08T00:00:00Z" 0)) (Pair 0 (Pair {} 10)))) (Pair (Pair (Pair 0 (Pair 200 10080)) (Pair False (Pair "${bankAddress}" "${sprayAddress}"))) (Pair (Pair "${tokenAddress}" (Pair {} "${moneyPoolAddress}")) (Pair {} (Pair 0 200)))))`;
    }

    getSprayStorage(voteAddress: string): string {
        return `(Pair (Pair (Pair "${this.adminPublicKey}" {}) (Pair {} 0)) (Pair (Pair {} {}) (Pair "${voteAddress}" {})))`;
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
            return op.confirmation(3).then(() => op.hash);
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

    async setTheVoteMetaData(theVoteAddress: string) {
        await this.setContractMetaDataWithHash(theVoteAddress, this.theVoteMetaData);
    }

    async setAuctionHouseMetaData(auctionHouseAddress: string) {
        await this.setContractMetaDataWithHash(auctionHouseAddress, this.auctionHouseMetaData);
    }

    async setTokenContractMetaData(tokenAddress: string) {
        await this.setContractMetaDataWithHash(tokenAddress, this.fa2ContractMetaData);
    }

    async setSprayMetaData(sprayAddress: string) {
        await this.setContractMetaDataWithHash(sprayAddress, this.sprayMetaData);
    }

    async originateAllContracts(bankAdmin: string) {

        // ToDO. Set the auction contract of the voter_money_pool. Otherwise only THE_VOTE could end auctions. which would be horrible
        const tokenContract = await this.originate(this.fa2ContractMichelsonCode, this.initialFA2Storage);
        console.log(`token: ${tokenContract.address}`);

        const voterMoneyPoolContract = await this.originate(this.voterMoneyPoolMichelsonCode, this.initialVoterMoneyPoolStorage);
        console.log(`voterMoneyPool: ${voterMoneyPoolContract.address}`);

        const auctionHouseContract = await this.originate(this.auctionHouseMichelsonCode, this.getInitialAuctionHouseStorage(tokenContract.address, voterMoneyPoolContract.address));
        console.log(`auctionHouse: ${auctionHouseContract.address}`);

        const theVoteContract = await this.originate(this.theVoteMichelsonCode, this.getTheVoteStorage(auctionHouseContract.address, voterMoneyPoolContract.address, tokenContract.address, tokenContract.address, tokenContract.address));
        console.log(`theVote: ${theVoteContract.address}`);

        const sprayTokenContract = await this.originate(this.sprayMichelsonCode, this.getSprayStorage(theVoteContract.address));
        console.log(`spray: ${sprayTokenContract.address}`);

        const bankContract = await this.originate(this.bankMichelsonCode, this.getBankStorage(sprayTokenContract.address, theVoteContract.address));
        console.log(`bank: ${bankContract.address}`);

        const vote = new TheVoteContract(this.tezos, theVoteContract.address);
        await vote.ready;

        const bank = new BankContract(this.tezos, bankContract.address);
        await bank.ready;

        const auctionHouse = new AuctionHouseContract(this.tezos, auctionHouseContract.address);
        await auctionHouse.ready;

        const fa2 = new FA2TokenContract(this.tezos, tokenContract.address);
        await fa2.ready;

        const voterMoneyPool = new VoterMoneyPoolContract(this.tezos, voterMoneyPoolContract.address);
        await voterMoneyPool.ready;

        const spray = new SprayContract(this.tezos, sprayTokenContract.address);
        await spray.ready;

        console.log('initiated all contracts in the local taquito-setup');
        await vote.setNextDeadlineMinutes(100);
        await vote.setSprayBankAddress(bank.getAddress());
        await vote.setSprayAddress(spray.getAddress());
        console.log('set all references of THE_VOTE')

        await voterMoneyPool.set_auction_house_address(auctionHouseContract.address);
        console.log('did set the auction house address of the voter-money-pool')

        await fa2.setAdministrator(vote.getAddress());
        await voterMoneyPool.setAdministrator(vote.getAddress());
        await auctionHouse.setAdministrator(vote.getAddress());
        console.log('did set the vote to the admin of the contracts');

        await spray.mint(bank.getAddress(), 10000, "new", undefined, sprayTOKENMetadata);
        console.log('did the mint for the bank')

        await bank.setAdministrator(bankAdmin);
        console.log('did set the bank admin');
    }


}
