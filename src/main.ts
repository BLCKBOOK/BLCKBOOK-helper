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
import {TheVoteContract} from './contracts/the_vote_contract';
import {
    auctionHouseContractAddress, auctionHouseMetadataIPFSHASH,
    bankContractAddress,
    sprayContractAddress, sprayMetadataIPFSHASH,
    theVoteContractAddress,
    tokenContractAddress,
    tokenMetadataIPFSHASH,
    voterMoneyPoolContractAddress,
    voterMoneyPoolMetadataIPFSHASH
} from './constants';
import {BankContract} from './contracts/bank_contract';
import {AuctionHouseContract} from './contracts/auction_house_contract';
import {FA2TokenContract} from './contracts/fa2_token_contract';
import {VoterMoneyPoolContract} from './contracts/voter_money_pool_contract';
import {SprayContract} from './contracts/spray_contract';



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

/*    await bank.setNewPeriod();*/

    const spray = new SprayContract(tezos, sprayContractAddress);
    await spray.ready;
    /*await spray.getMintParameter()*/

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

    await originator.setContractMetaDataWithHash(sprayContractAddress, sprayMetadataIPFSHASH); // does not have set_metadata endpoint... why?

    /*await vote.calculateAndVote(1, 2, 0);
    await vote.calculateAndVote(1, 2, 0);*/


    /*await vote.admission('QmXPeXvyMLXqyhwB6owYMms8o8zqu2v2ofMvX25nGjJGFx', user2.pkh);
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
