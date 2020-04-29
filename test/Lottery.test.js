const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');


const provider = ganache.provider();
const web3 = new Web3(provider);

const { interface, bytecode } = require('../compile');

let accounts;
let lottery;

beforeEach(async () => {
  // Get a list of all accounts
  accounts = await web3.eth.getAccounts();
  // Use one of those accounts to deploy the contract
  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({data: '0x' + bytecode }) // add 0x bytecode
    .send({from: accounts[0]});

  lottery.setProvider(provider);
});

describe('Lottery', () => {
  it('deploys a contract', () => {
    assert.ok(lottery.options.address);
  });

  it('Allows one account to enter', async () => {
    await lottery.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei('0.02', 'ether')
    });
    const players = await lottery.methods.getPlayers().call({
      from: accounts[0]
    });
    assert.equal(accounts[1], players[0]);
    assert.equal(1, players.length);
  });

  it('Allows mult account to enter', async () => {
    await lottery.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei('0.02', 'ether')
    });
    await lottery.methods.enter().send({
      from: accounts[2],
      value: web3.utils.toWei('0.02', 'ether')
    });
    await lottery.methods.enter().send({
      from: accounts[3],
      value: web3.utils.toWei('0.02', 'ether')
    });
    const players = await lottery.methods.getPlayers().call({
      from: accounts[0]
    });
    assert.equal(accounts[1], players[0]);
    assert.equal(accounts[2], players[1]);
    assert.equal(accounts[3], players[2]);
    assert.equal(3, players.length);
  });

  it('require a min ammount of ether to enter', async () => {
    try {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: 200
    });
    assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it('only manager can call pickWinner', async () => {
    try {
    await lottery.methods.pickWinner().send({
      from: accounts[1],
    });
    assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it('end-to-end test', async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('2', 'ether')
    });

    const initialBalance = await web3.eth.getBalance(accounts[0]);

    await lottery.methods.pickWinner().send({
      from: accounts[0],
    });

    const finalBalance = await web3.eth.getBalance(accounts[0]);

    const difference = finalBalance - initialBalance;

    assert(difference > web3.utils.toWei('1.99', 'ether'));
    const players = await lottery.methods.getPlayers().call({
      from: accounts[0]
    });
    assert.equal(0, players.length);

  });

});
