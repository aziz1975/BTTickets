## BT Tickets

**Goal**: BT Tickets is an on-chain ticketing system, the contract is able to record Problem Reports and Feature Requests but can be re-purposed for any ticketing solution, fully on-chain, no backend needed.


## Contract

### BTTC Compile & Deployment steps

1. Install Forge from https://getfoundry.sh
2. git clone this repo
3. Run the following commands in terminal:

```shell
$ cd BTTickets
$ forge install OpenZeppelin/openzeppelin-contracts
$ forge compile
$ forge create --legacy OnchainTicket --rpc-url https://rpc.bt.io/ --interactive
```

## UI

Basic proof of concept UI can be found in the /frontend directory. 

```
