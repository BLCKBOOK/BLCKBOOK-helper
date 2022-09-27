import {ContractAbstraction, ContractProvider, TezosToolkit} from '@taquito/taquito';
import {char2Bytes} from '@taquito/tzip16';
import {admin} from './faucet';
import {
    auctionHouseMetadataIPFSHASH,
    contracts,
    ipfsPrefix,
    sprayMetadataIPFSHASH,
    sprayTOKENMetadataIPFSHASH,
    tokenMetadataIPFSHASH,
    voteMetadataIPFSHASH,
    voterMoneyPoolMetadataIPFSHASH
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
        const call = await contract.methodsObject.set_metadata({
            k: '',
            v: char2Bytes(ipfsPrefix + ipfsHash)
        }).send({
            fee: 800
        })

        console.log(`Waiting for ${call.hash} to be confirmed...`);
        await call.confirmation(3);
        console.log(`Operation injected: https://ghost.tzstats.com/${call.hash}`)
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
        await this.setContractMetaDataWithHash(theVoteAddress, voteMetadataIPFSHASH);
    }

    async setAuctionHouseMetaData(auctionHouseAddress: string) {
        await this.setContractMetaDataWithHash(auctionHouseAddress, auctionHouseMetadataIPFSHASH);
    }

    async setTokenContractMetaData(tokenAddress: string) {
        await this.setContractMetaDataWithHash(tokenAddress, tokenMetadataIPFSHASH);
    }

    async setSprayMetaData(sprayAddress: string) {
        await this.setContractMetaDataWithHash(sprayAddress, sprayMetadataIPFSHASH);
    }

    async setVoterMoneyPoolMetaData(voterMoneyPoolAddress: string) {
        await this.setContractMetaDataWithHash(voterMoneyPoolAddress, voterMoneyPoolMetadataIPFSHASH);
    }

    async originateTheVote() {
        const theVoteContract = await this.originate(this.theVoteMichelsonCode, this.getTheVoteStorage(contracts.auctionHouseContractAddress, contracts.voterMoneyPoolContractAddress, contracts.bankContractAddress, contracts.sprayContractAddress, contracts.tokenContractAddress));
        console.log(`theVote: ${theVoteContract.address}`);
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

        console.log('') // output for easy copy/paste
        console.log(`tokenContractAddress: \"${tokenContract.address}\",`);
        console.log(`voterMoneyPoolContractAddress: \"${voterMoneyPoolContract.address}\",`);
        console.log(`auctionHouseContractAddress: \"${auctionHouseContract.address}\",`);
        console.log(`theVoteContractAddress: \"${theVoteContract.address}\",`);
        console.log(`sprayContractAddress: \"${sprayTokenContract.address}\",`);
        console.log(`bankContractAddress: \"${bankContract.address}\",`);
        console.log('')

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

        try {
            await this.setTokenContractMetaData(tokenContract.address);
            await this.setSprayMetaData(spray.getAddress());
            await this.setAuctionHouseMetaData(auctionHouse.getAddress());
            await this.setTheVoteMetaData(vote.getAddress());
            await this.setVoterMoneyPoolMetaData(voterMoneyPool.getAddress());
        } catch (e) {
            console.error('some error in the meta-data setting again');
            console.error(e);
        }

        console.log('setting the votes contract-addresses')
        await vote.setNextDeadlineMinutes(20);
        await vote.setSprayBankAddress(bank.getAddress());
        await vote.setSprayAddress(spray.getAddress());
        console.log('set all references of THE_VOTE');

        await voterMoneyPool.set_auction_house_address(auctionHouseContract.address);
        console.log('did set the auction house address of the voter-money-pool');

        await fa2.setAdministrator(vote.getAddress());
        await voterMoneyPool.setAdministrator(vote.getAddress());
        await auctionHouse.setAdministrator(vote.getAddress());
        console.log('did set the vote to the admin of the contracts');

        await spray.mint(bank.getAddress(), 10000, 'new', undefined, sprayTOKENMetadataIPFSHASH);
        console.log('did the mint for the bank');

        await bank.setAdministrator(bankAdmin);
        console.log('did set the bank admin');
    }


}
