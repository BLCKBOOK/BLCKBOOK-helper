import {faucet, user1, user2} from './faucet';
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
    auctionHouseContractAddress,
    bankContractAddress,
    sprayContractAddress,
    theVoteContractAddress, tokenContractAddress, voterMoneyPoolContractAddress
} from './constants';
import {BankContract} from './contracts/bank_contract';
import {AuctionHouseContract} from './contracts/auction_house_contract';
import {FA2TokenContract} from './contracts/fa2_token_contract';
import {VoterMoneyPoolContract} from './contracts/voter_money_pool_contract';



// now do the setup for Pinata
const pinata = pinataSDK(pinataKeys.key, pinataKeys.secret);

pinata.testAuthentication().then((result) => {
    //handle successful authentication here
    console.log(result);
}).catch((err) => {
    //handle error here
    console.log(err);
});


const ipfsPrefix = 'ipfs://';

// This will then probably be needed for the activation of multiple accounts.
// Somehow I need a user-management
async function activateAccount() {
}

async function main() {
    const anotherNetwork = 'https://ghostnet.smartpy.io';
    const rpc = 'https://rpc.ghostnet.teztnets.xyz';
    const yetAnotherRpc = 'https://ghostnet.ecadinfra.com'

    const tezos = new TezosToolkit(rpc);

    tezos.setSignerProvider(InMemorySigner.fromFundraiser(faucet.email, faucet.password, faucet.mnemonic.join(' ')));

    tezos.addExtension(new Tzip16Module());

    importKey(
        tezos,
        faucet.email,
        faucet.password,
        faucet.mnemonic.join(' '),
        faucet.activation_code
    ).catch((e: any) => console.error(e));


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

    await bank.canWithdraw(faucet.pkh);
    await bank.canWithdraw(user1.pkh);
    await bank.canWithdraw(user2.pkh);

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
function activateFaucetKey() {
    const {pkh, activation_code} = faucet;

    try {
        const operation = await tezos.tz.activate(pkh, activation_code);
        await operation.confirmation(2);
    } catch (e) {
        console.log(e);
    }
}
*/

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
