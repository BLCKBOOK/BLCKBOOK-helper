import {admin, user1, user2, user3, user4, userNotRegistered} from './faucet';
import {pinataKeys} from './pinata-keys';
import {importKey, InMemorySigner} from '@taquito/signer';
import {char2Bytes, Tzip16Module} from '@taquito/tzip16';
import pinataSDK from '@pinata/sdk';
import {
    ContractAbstraction,
    ContractProvider,
    MichelsonMap,
    TezosToolkit,
    TransactionOperation,
    TransactionWalletOperation
} from '@taquito/taquito';
import {Originator} from './originator';
import {ArtworkParams, TheVoteContract} from './contracts/the_vote_contract';
import {
    auctionHouseContractAddress, auctionHouseMetadataIPFSHASH,
    bankContractAddress, maxConcurrency,
    sprayContractAddress, sprayMetadataIPFSHASH, sprayTOKENMetadata,
    theVoteContractAddress,
    tokenContractAddress,
    tokenMetadataIPFSHASH, tzktAddress, voteMetadataIPFSHASH,
    voterMoneyPoolContractAddress,
    voterMoneyPoolMetadataIPFSHASH
} from './constants';
import {BankContract} from './contracts/bank_contract';
import {AuctionHouseContract} from './contracts/auction_house_contract';
import {FA2TokenContract} from './contracts/fa2_token_contract';
import {VoterMoneyPoolContract} from './contracts/voter_money_pool_contract';
import {SprayContract} from './contracts/spray_contract';
import fetch from 'node-fetch';
import {TzktArtworkInfoBigMapKey, TzktVotesRegisterBigMapKey} from './types';



// now do the setup for Pinata
/*const pinata = pinataSDK(pinataKeys.key, pinataKeys.secret);

pinata.testAuthentication().then((result) => {
    //handle successful authentication here
    console.log(result);
}).catch((err) => {
    //handle error here
    console.log(err);
});*/


const ipfsPrefix = 'ipfs://';


// This will then probably be needed for the activation of multiple accounts.
// Somehow I need a user-management
async function activateAccount() {
}

export interface User {
    email: string,
    password: string,
    mnemonic: string[],
    activation_code: string,
    pkh: string,
}

async function main() {

    /**
     * ToDo for backend:
     *  Sometimes these RPCs have down-times and switching between them should be tried.
     */

    const anotherNetwork = 'https://ghostnet.smartpy.io';
    const rpc = 'https://rpc.ghostnet.teztnets.xyz';
    const yetAnotherRpc = 'https://ghostnet.ecadinfra.com'

    const tezos = new TezosToolkit(rpc);

    await setUser(tezos, admin as User)
    const originator = new Originator(tezos);

    const vote = new TheVoteContract(tezos, theVoteContractAddress);
    await vote.ready;

    const bank = new BankContract(tezos, bankContractAddress);
    await bank.ready;

    const auctionHouse = new AuctionHouseContract(tezos, auctionHouseContractAddress);
    await auctionHouse.ready;

    const fa2 = new FA2TokenContract(tezos, tokenContractAddress);
    await fa2.ready;

    const voterMoneyPool = new VoterMoneyPoolContract(tezos, voterMoneyPoolContractAddress);
    await voterMoneyPool.ready;

    const spray = new SprayContract(tezos, sprayContractAddress);
    await spray.ready;

    const newTheVote = 'KT1KfttT5ZVLYxi9V8JjrM3Dncg4evdESSyW';

    /*await vote.setAdminOfAuctionContract(newTheVote);
    await vote.setAdminOfPoolContract(newTheVote);
    await vote.setAdminOfTokenContract(newTheVote);

    await setUser(tezos, user2);
    await bank.setTheVoteAddress(newTheVote);

    const newVote = new TheVoteContract(tezos, newTheVote);
    await newVote.ready;

    await newVote.setNextDeadlineMinutes(15);*/

    const newVote = new TheVoteContract(tezos, newTheVote);
    await newVote.ready;

    await newVote.setNextDeadlineMinutes(20);

    /*    await vote.setAdminOfTokenContract(admin.pkh);
        await originator.setContractMetaDataWithHash(tokenContractAddress, tokenMetadataIPFSHASH);*/
    /*    await fa2.setAdministrator(theVoteContractAddress);*/

    /*    await vote.setAdminOfPoolContract(admin.pkh);
        await originator.setContractMetaDataWithHash(voterMoneyPoolContractAddress, voterMoneyPoolMetadataIPFSHASH);
        await voterMoneyPool.setAdministrator(theVoteContractAddress);*/

    /*    await vote.setAdminOfAuctionContract(admin.pkh);
        await originator.setContractMetaDataWithHash(auctionHouseContractAddress, auctionHouseMetadataIPFSHASH);*/
    /*    await auctionHouse.setAdministrator(theVoteContractAddress);*/

    // await vote.calculateAndVote(1, 160, 42)

/*    await mintAndBuildNotifications(tezos, vote);

    await vote.admission('QmWNX6uPijNy6tt9Uo9WgHDRMfWPDQA8Tj8MkPn6DwQXSf', 'tz1LfhkLnSuixoDf9aYc3a3MyC5srGKBGSPu');*/
/*    await vote.setVotesTransmissionLimitDuringMinting(100);

    /*await vote.calculateAndVote(1, 2, 0);
    await vote.calculateAndVote(1, 2, 0);*/
/*

    await vote.admission('QmXPeXvyMLXqyhwB6owYMms8o8zqu2v2ofMvX25nGjJGFx', user2.pkh);
    await vote.admission('QmXPeXvyMLXqyhwB6owYMms8o8zqu2v2ofMvX25nGjJGFx', user1.pkh);
    await vote.admission('QmXPeXvyMLXqyhwB6owYMms8o8zqu2v2ofMvX25nGjJGFx', admin.pkh);*/

    // await vote.calculateAndVote(3, 1, 1);

    /*await bank.canWithdraw(faucet.pkh);
    await bank.canWithdraw(user1.pkh);
    await bank.canWithdraw(user2.pkh);*/

   /* the_vote.set_spray_contract(spray.address).run(sender=admin)
    the_vote.set_spray_bank_address(bank.address).run(sender=admin)
    bank.set_the_vote_address(the_vote.address).run(sender=admin)

    auction_house.set_administrator(the_vote.address).run(sender=admin)
    voter_money_pool.set_administrator(the_vote.address).run(sender=admin)
    fa2.set_administrator(the_vote.address).run(sender=admin)*/
}

main().then(() => console.log('all successful'));

async function mintAndBuildNotifications(tezos: TezosToolkit, vote: TheVoteContract): Promise<boolean> {

    /*
        ToDo for backend:
         - save a value so we do not get the notifications multiple times!
           For example use the max_auction_and_token_id. If it has not changed there was no NFT minted
           (obviously save it AFTER the minting).
         - make sure that wrong parsings of
     */
    if (!(await vote.deadlinePassed())) {
        console.log('deadline has not passed. So we are not minting, only getting the notifications');
    } else {
        const allMinted = await vote.mintArtworksUntilReady();
        if (!allMinted) {
            return false;
        }
    }

    // now get the max_auction_and_token_id because all artworks are already minted
    let response = await fetch(`${tzktAddress}contracts/${tokenContractAddress}/storage`);
    let storageData = await response.json();
    let max_auction_and_token_id;
    if (storageData.all_tokens) {
        max_auction_and_token_id = storageData.all_tokens;
    } else {
        console.log('we did not get all tokens for some reason');
        return false;
    }

    const storageBeforeMinting = await vote.calculateArtworksToMintSet();
    if (!storageBeforeMinting) {
        return false;
    }

    let minIndex = max_auction_and_token_id - storageBeforeMinting.artworks_to_mint.length;
    let bigMagIdOfVotesRegistry = storageBeforeMinting.vote_register;
    let bigMapIdOfArtworkInfo = storageBeforeMinting.artwork_data;

    const artworksToMint = storageBeforeMinting.artworks_to_mint;

    // this is a bit of a hack for limiting the concurrency. We are splicing the array and need to increase the index.
    for(let spliceAmount = 0; artworksToMint.length; spliceAmount++) {
        await Promise.all(artworksToMint.splice(0, maxConcurrency).map(async (artwork_id, index) => {
            index = index + maxConcurrency * spliceAmount;
            let voters: string[] = [];
            try {
                let response = await fetch(`${tzktAddress}bigmaps/${bigMagIdOfVotesRegistry}/keys/${artwork_id}`);
                voters = ((await response.json()) as TzktVotesRegisterBigMapKey).value;
            } catch (error: any) {
                console.log(`error getting the voters of the artwork_id: ${artwork_id}`);
                console.log(error);
            }

            let artwork_and_token_id = minIndex + index;
            for (let voter of voters) {
                console.log(`the voter ${voter} voted for the artwork_and_token_id ${artwork_and_token_id}`);
                // ToDo write this into building notifications for the voters
            }
            try {
                let artwork_id_response = await fetch(`${tzktAddress}bigmaps/${bigMapIdOfArtworkInfo}/keys/${artwork_id}`);
                let uploader = ((await artwork_id_response.json()) as TzktArtworkInfoBigMapKey).value.uploader;
                console.log(`the uploader ${uploader} uploaded the artwork_and_token_id ${artwork_and_token_id}`);
                // ToDo write this into building notifications for the uploader
            } catch (error: any) {
                console.log(`error getting the uploader of the artwork_id: ${artwork_id}`);
                console.log(error);

            }
        }));
    }


    return true;
}


async function setUser(tezos: TezosToolkit, currentUser: User) {
    tezos.setSignerProvider(InMemorySigner.fromFundraiser(currentUser.email, currentUser.password, currentUser.mnemonic.join(' ')));

    tezos.addExtension(new Tzip16Module());

    importKey(
        tezos,
        currentUser.email,
        currentUser.password,
        currentUser.mnemonic.join(' '),
        currentUser.activation_code
    ).catch((e: any) => console.error(e));
}

async function artworkTestAdmission(tezos: TezosToolkit, vote: TheVoteContract, spray: SprayContract, mintSprayForUsers = false) {
    if (mintSprayForUsers) {
        await spray.mint(user1.pkh, 10000000, 'existing', 0);
        await spray.mint(user2.pkh, 10000000, 'existing', 0);
        await spray.mint(user3.pkh, 10000000, 'existing', 0);
        await spray.mint(user4.pkh, 10000000, 'existing', 0);
    }


    let contractParams: ArtworkParams[] = [];
    for (let i = 0; i < 150; i++) {
        contractParams.push({ipfsLink: 'QmXNVrXBHhRUA9B8HkySEiNpuFvhaxFDqFeDGxdyFvajHP', uploader: user1.pkh})
    }
    for (let i = 0; i < 2; i++) {
        await vote.batchAdmission(contractParams);
    }

    const response2 = await fetch(`${tzktAddress}contracts/${theVoteContractAddress}/storage`);
    const storageData = await response2.json();

    const allArtworks = parseInt(storageData.all_artworks);
    const admissions_this_period = parseInt(storageData.admissions_this_period);

    await setUser(tezos, user1);
    const batchSize = 299
    for (let i = 0; i < Math.floor((admissions_this_period) / batchSize); i++) {
        await vote.voteBatch((i * batchSize), batchSize, allArtworks - admissions_this_period);
    }
    await setUser(tezos, user2);
    for (let i = 0; i < Math.floor((admissions_this_period) / batchSize); i++) {
        await vote.voteBatch((i * batchSize), batchSize, allArtworks - admissions_this_period);
    }
    await setUser(tezos, user3);
    for (let i = 0; i < Math.floor((admissions_this_period) / batchSize); i++) {
        await vote.voteBatch((i * batchSize), batchSize, allArtworks - admissions_this_period);
    }
    await setUser(tezos, user4);
    for (let i = 0; i < Math.floor((admissions_this_period) / batchSize); i++) {
        await vote.voteBatch((i * batchSize), batchSize, allArtworks - admissions_this_period);
    }
}

/*
    TODO:
      - fix the originator deploy all contracts to deploy all contracts
 */
