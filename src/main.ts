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
    bankContractAddress,
    sprayContractAddress, sprayMetadataIPFSHASH, sprayTOKENMetadata, theOldVoteContractAddress,
    theVoteContractAddress,
    tokenContractAddress,
    tokenMetadataIPFSHASH, voteMetadataIPFSHASH,
    voterMoneyPoolContractAddress,
    voterMoneyPoolMetadataIPFSHASH
} from './constants';
import {BankContract} from './contracts/bank_contract';
import {AuctionHouseContract} from './contracts/auction_house_contract';
import {FA2TokenContract} from './contracts/fa2_token_contract';
import {VoterMoneyPoolContract} from './contracts/voter_money_pool_contract';
import {SprayContract} from './contracts/spray_contract';
import fetch from 'node-fetch';



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

async function artworkTestAdmission(tezos: TezosToolkit) {

}

async function main() {
    const anotherNetwork = 'https://ghostnet.smartpy.io';
    const rpc = 'https://rpc.ghostnet.teztnets.xyz';
    const yetAnotherRpc = 'https://ghostnet.ecadinfra.com'

    const tezos = new TezosToolkit(rpc);

    await setUser(tezos, admin as User)

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

    const originator = new Originator(tezos);

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

    /*await vote.admission('QmXPeXvyMLXqyhwB6owYMms8o8zqu2v2ofMvX25nGjJGFx', 'tz1LfhkLnSuixoDf9aYc3a3MyC5srGKBGSPu');*/

    /*    await vote.mintArtworks(10);*/
    /*await spray.mint(user2.pkh, 10000000, 'existing', 0);*/

/*    await spray.mint(user1.pkh, 10000000, 'existing', 0);
    await spray.mint(user2.pkh, 10000000, 'existing', 0);*/

/*    let contractParams: ArtworkParams[] = [];
    for (let i = 0; i < 150; i++) {
        contractParams.push({ipfsLink: 'QmXNVrXBHhRUA9B8HkySEiNpuFvhaxFDqFeDGxdyFvajHP', uploader: user1.pkh})
    }
    for (let i = 0; i < 4; i++) {
        await vote.batchAdmission(contractParams);
    }*/

    const response2 = await fetch(`https://api.ghostnet.tzkt.io/v1/contracts/${theVoteContractAddress}/storage`);
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

/*    await spray.mint(user4.pkh, 10000000, 'existing', 0);

    await setUser(tezos, user4);

    const response2 = await fetch(`https://api.ghostnet.tzkt.io/v1/contracts/${theVoteContractAddress}/storage`);
    const storageData = await response2.json();

    const allArtworks = parseInt(storageData.all_artworks);
    const admissions_this_period = parseInt(storageData.admissions_this_period);

    const batchSize = 300
    for (let i = 0; i < 10; i++) {
        await vote.voteBatch((i * batchSize), batchSize, allArtworks - admissions_this_period);
    }*/

/*    await vote.setVotesTransmissionLimitDuringMinting(100);


    await vote.mintArtworksUntilReady();*/

/*    await vote.mintArtworks(10);
    await vote.admission('QmXPeXvyMLXqyhwB6owYMms8o8zqu2v2ofMvX25nGjJGFx', user2.pkh);
    await vote.admission('QmanQwBarZr18BTLqgv71uCchBdio3zNWgKeJLFg8PRjzu', admin.pkh);
    await vote.admission('QmXNVrXBHhRUA9B8HkySEiNpuFvhaxFDqFeDGxdyFvajHP', user3.pkh);
    await vote.admission('QmQyFjRtMDawoWNPvVASZ4FLA5JiFQPmytLGjxBmK9tyfe', user4.pkh);
    await vote.admission('QmPy3M2ZPeKpupm6GDeBNVRUazR2aKoxYWVGkwuawddSQW', userNotRegistered.pkh);
    await vote.admission('QmWyDEgQB4PhGnL1VkTgrSGpgR7TkTxPXpDu5eZfmAyau7', userNotRegistered.pkh);
    await vote.admission('QmVZMh9Ar3omACPFMm3WpRKK5MEr9FfsGdVJo9WUd5v7Zn', userNotRegistered.pkh);
    await vote.admission('QmWT7zgaAGgM9z7vQ5DeUkdAQ7EfyEpHtHafuHnMkp7m1p', userNotRegistered.pkh);
    await vote.admission('QmUNjCMGHQa4Atz8jeFFdLYn38rV7Do7kwwkSrKgzbEwcY', userNotRegistered.pkh);
    await vote.admission('QmQgjUfWf4MYzPjRWbgv6rWFfAKkz49eZwN2mT4m1BYTuq', userNotRegistered.pkh);
    await vote.admission('QmaozD3Ax8HRDPMwTbfT8TwGp2AN1Ta9zfL53MwpmxFq6E', userNotRegistered.pkh);
    await vote.admission('QmcVjDxkRjc9MkwVQvRU3CMctuNqNMFAPgS6LTwoiEb3v2', userNotRegistered.pkh);
    await vote.admission('QmTzcP6SMfPZhnXtbopfqGxcBSBUbovW5w2h7eKVAw4DE6', userNotRegistered.pkh);
    await vote.admission('QmWp47j6wRyA6gQ6w5CmDZ7FWcPks89ViaEZqaki9Bx9vh', userNotRegistered.pkh);
    await vote.admission('Qme5VWaq69t7jYN17cY3T6Li2rKwma32NgbvU5hgjYv48Y', userNotRegistered.pkh);
    await vote.admission('QmfJEYbtBnVhCi8m9BPrXtUWvxmSkn8Ut8bkZiu1gcYqvm', userNotRegistered.pkh);
    await vote.admission('QmQVKBzaKFPjBZsD4ghR2pMSx3Veaq6vgMfNUe8GomoZRU', userNotRegistered.pkh);
    await vote.admission('QmX2rbGWak9rLmtHwi6xS4mhHSC12JJSQDn4cwkSLxyfQ2', userNotRegistered.pkh);
    await vote.admission('QmbXpWfjiY8dkKhUt4szLfG3F6VuXuhixPUteXrxZY1RvE', userNotRegistered.pkh);
    await vote.admission('QmXFgH9BicykhKef4vFvanY5W797jrD3d8vkaeijVezW4a', userNotRegistered.pkh);
    await vote.admission('QmYf2P14rU6vDZzk4GrvcF2yFduhsypqojfRp9xLf2P2XT', userNotRegistered.pkh);
    await vote.admission('Qmco6iHy9o9qzXeWqTLpjboxC5iVpt4g3mxT746V6Yhfon', userNotRegistered.pkh);
    await vote.admission('QmfGzPmtmt4W4nAYQCvKV1ewfxfUXNs738pn8Bm9eWeDPu', userNotRegistered.pkh);
    await vote.admission('QmVgFPRL7MEwerL7n1FigaaBVmjLwRUj3qUAdfVQjVLkQs', userNotRegistered.pkh);
    await vote.admission('QmcknedrSmnxwZvEHAKUjWUVaC3ffSJWv7UZNTgCEeH2ZW', userNotRegistered.pkh);
    await vote.admission('QmPuea4wYvPqK5pGgD1YqVSGzsb66Kwwu61jh62gJMTC9G', userNotRegistered.pkh);
    await vote.admission('QmVeciMYv68qLZ8cs7jD6FUm9F25C6PWtx7aDFKnnfEwrW', userNotRegistered.pkh);
    await vote.admission('QmXzwFof5kpm3Hu85frtZJcDkjfpYkRuu1BMq8iQmoABXN', userNotRegistered.pkh);
    await vote.admission('QmXzwFof5kpm3Hu85frtZJcDkjfpYkRuu1BMq8iQmoABXN', userNotRegistered.pkh);
    await vote.admission('QmWmBLwUB1dN9DCnEdxkBdwfNtXg1q5teEUfqVzZuE1Vvh', userNotRegistered.pkh);
    await vote.admission('QmTrtFN6m6LvTqEzcEr4645pL5buNL6y5PQMEyF9xTkMnq', userNotRegistered.pkh);
    await vote.admission('QmXdYagMLLp27j9uaPdJmUihmEWETXQN9NJ4dS5pP5QVDR', userNotRegistered.pkh);
    await vote.admission('QmYJbRKgKVwi94AqvDjqoHLtrUoGi1fY1MBNRRVBFTjLZ1', userNotRegistered.pkh);
    await vote.admission('QmWuadCuboN9YFXBM124BusnDz3CnJyruv47EWVC491hkG', userNotRegistered.pkh);
    await vote.admission('QmVUxWhyDeHoAiL6qHbZmqDwwFxTvt1L3rmV4UeaFadGRV', userNotRegistered.pkh);
    await vote.admission('QmdcLLc9H4Qhp4g8D3GSg8WgAHbLAsaS7yuYbpHYDiL3W9', userNotRegistered.pkh);
    await vote.admission('QmX9TuJMNGkQMwpBx33TcUx159NZp4WgVJbtwQtbyoPZEj', userNotRegistered.pkh);
    await vote.admission('QmWEkpFmg3AofJ8Tf6XoPxuR5Ks8AXiYbE1w5k3ghfmvLR', userNotRegistered.pkh);
    await vote.admission('QmVnNrp5fsuxtr2vFRkYd99HrzFpcyZkPNjyNTZbmsRmmk', userNotRegistered.pkh);
    await vote.admission('QmVpGgk73aUTgJfu4HrHDfeZ3amngUmy6xrngjBABG6wWs', userNotRegistered.pkh);
    await vote.admission('QmdoyWG6iQnTVDHS3J65HJMx69ipKPGSutyeJkyTjvk5Ct', userNotRegistered.pkh);
    await vote.admission('QmcsPwFkCPrCzMEw6LtLTdRMm5k2jjHEx88Ci3RmgMFJUp', userNotRegistered.pkh);
    await vote.admission('QmUMpXpjYpmNXKS5KEYDFAS344RnB9jX4mAgQfnbT9Xnpw', userNotRegistered.pkh);
    await vote.admission('QmSukjgRjvNhvivWQ4hCeBDqca8FJ9ZQptRERgHADNnveZ', userNotRegistered.pkh);*/






    //await originator.setContractMetaDataWithHash(sprayContractAddress, sprayMetadataIPFSHASH); // TODO: does not have set_metadata endpoint... why?

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


/*    await vote.mintArtworks(0);

    await vote.admission('QmXPeXvyMLXqyhwB6owYMms8o8zqu2v2ofMvX25nGjJGFx', user2.pkh);*/

   /* the_vote.set_spray_contract(spray.address).run(sender=admin)
    the_vote.set_spray_bank_address(bank.address).run(sender=admin)
    bank.set_the_vote_address(the_vote.address).run(sender=admin)

    auction_house.set_administrator(the_vote.address).run(sender=admin)
    voter_money_pool.set_administrator(the_vote.address).run(sender=admin)
    fa2.set_administrator(the_vote.address).run(sender=admin)*/


    // then find out about the user-stuff
}

main().then(() => console.log('all successful'));

/*
    TODO:
      - check out batch-transfers
      - restructure this entire file into multiple files with classes for all contracts (see "oldMethods")
      - write a method that deploys all contracts, sets the cyclic dependencies and prints their addresses for easy usage
      - read into estimation of costs
      - maybe run an own tezos-node on the ubuntu subsystem? or is that like total and utter overkill
        could I even connect such a node to taquito to run the tests?
      -
 */


/**
 * TODO - Restructuring
 * We should simulate actual usage of the contracts. Find out whether Taquito-Scripts can generate users, save their data and log-in as them
 * The contract abstractions probably are per-user basis as the login into Taquito is per-User
 *  can this be changed easily or do I need to create sub-scripts that get called?
 * Of course the usual tests just are for the admin and not anyone else.
 */

/*
 TODO
 user-management. Somehow I need a lot of faucet files or something and be able to reload them or from them.
 Also I need a way to see if a deadline has passed and if it has passed then execute something
 Probably my file s
 */
